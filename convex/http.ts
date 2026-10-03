import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

function parseSignature(header: string): { timestamp: string; test: string; live: string } | null {
  const parts = Object.fromEntries(header.split(",").map((part) => {
    const [key, value] = part.split("=", 2);
    return [key, value];
  }));
  if (!parts.t) return null;
  return { timestamp: parts.t, test: parts.te ?? "", live: parts.li ?? "" };
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

http.route({
  path: "/paymongo-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const rawBody = await request.text();
    const header = request.headers.get("Paymongo-Signature");
    const secret = process.env.PAYMONGO_WEBHOOK_SECRET;
    if (!header || !secret) return new Response("Unauthorized", { status: 401 });

    const signature = parseSignature(header);
    const livemode = process.env.PAYMONGO_LIVEMODE === "true";
    if (!signature || Math.abs(Date.now() / 1000 - Number(signature.timestamp)) > 300) {
      return new Response("Unauthorized", { status: 401 });
    }
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const digest = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(`${signature.timestamp}.${rawBody}`)
    );
    const expected = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
    if (!constantTimeEqual(expected, livemode ? signature.live : signature.test)) {
      return new Response("Unauthorized", { status: 401 });
    }

    let payload: unknown;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return new Response("Invalid payload", { status: 400 });
    }
    if (typeof payload !== "object" || payload === null) return new Response("Invalid payload", { status: 400 });
    const data = (payload as { data?: { attributes?: { type?: string; livemode?: boolean; data?: { attributes?: { payment_intent_id?: string } } } } }).data;
    const attributes = data?.attributes;
    const eventType = attributes?.type;
    const payloadData = (payload as { data?: { id?: string } }).data;
    const intentId = eventType === "payment_intent.awaiting_payment_method"
      ? payloadData?.id
      : attributes?.data?.attributes?.payment_intent_id;
    if (attributes?.livemode !== livemode) return new Response("Mode mismatch", { status: 400 });
    if ((eventType === "payment.paid" || eventType === "payment.failed" || eventType === "payment_intent.awaiting_payment_method") && intentId) {
      await ctx.runMutation(internal.payments.applyPaymentWebhook, {
        intentId,
        status: eventType === "payment.paid" ? "paid" : eventType === "payment_intent.awaiting_payment_method" ? "expired" : "failed",
      });
    }
    return Response.json({ received: true });
  }),
});

export default http;
