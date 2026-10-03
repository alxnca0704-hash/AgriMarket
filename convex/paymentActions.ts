import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

type PaymentOrder = {
  _id: Id<"orders">;
  total: number;
  paymentMethod: "cod" | "gcash";
  paymentStatus: "unpaid" | "paid" | "failed" | "expired" | "awaiting_gcash_authorization" | "awaiting_payment_method";
  status: string;
  paymentIntentId?: string;
  paymentClientKey?: string;
  paymentMethodId?: string;
  paymentRedirectUrl?: string;
  buyerTokenIdentifier: string;
};

const intentResponseValidator = v.object({
  orderId: v.id("orders"),
  redirectUrl: v.string(),
});

function authorization(): string {
  const secret = process.env.PAYMONGO_SECRET_KEY;
  if (!secret) throw new Error("PayMongo is not configured on the server");
  return `Basic ${btoa(`${secret}:`)}`;
}

async function paymongoRequest(path: string, body: unknown, idempotencyKey: string) {
  const response = await fetch(`https://api.paymongo.com/v1/${path}`, {
    method: "POST",
    headers: {
      Authorization: authorization(),
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(body),
  });
  const result: unknown = await response.json();
  if (!response.ok) {
    const errors =
      typeof result === "object" && result !== null && "errors" in result
        ? (result as { errors?: Array<{ code?: string; detail?: string }> }).errors
        : undefined;
    const providerError = errors?.[0];
    const reason = providerError?.detail ?? providerError?.code;
    throw new Error(
      reason
        ? `PayMongo rejected the ${path} request: ${reason}`
        : `PayMongo rejected the ${path} request (HTTP ${response.status}). Check the Convex logs.`,
    );
  }
  return result as { data?: { id?: string; attributes?: { client_key?: string; next_action?: { redirect?: { url?: string } } } } };
}

export const createGcashPayment = action({
  args: { orderId: v.id("orders"), returnUrl: v.string() },
  returns: intentResponseValidator,
  handler: async (ctx, args): Promise<{ orderId: Id<"orders">; redirectUrl: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const order: PaymentOrder | null = await ctx.runQuery(internal.payments.getOrderForPayment, {
      orderId: args.orderId,
      tokenIdentifier: identity.tokenIdentifier,
    });
    if (!order || order.paymentMethod !== "gcash") throw new Error("Order not found");
    if (!identity.email) throw new Error("Add and verify an email address on your Clerk account before paying with GCash");
    if (order.paymentStatus === "paid") throw new Error("This order is already paid");
    if (order.status !== "pending" && order.status !== "awaiting_gcash_authorization" && order.status !== "awaiting_payment_method") throw new Error("This order is no longer payable");
    if (order.paymentRedirectUrl) return { orderId: order._id, redirectUrl: order.paymentRedirectUrl };

    let returnUrl: URL;
    try {
      returnUrl = new URL(args.returnUrl);
    } catch {
      throw new Error("Invalid payment return address");
    }
    const appBaseUrl = process.env.APP_BASE_URL;
    if (!appBaseUrl || returnUrl.origin !== new URL(appBaseUrl).origin) {
      throw new Error("Payment return address does not match the configured app URL");
    }

    const orderId = order._id as Id<"orders">;
    const intent = order.paymentIntentId ? null : await paymongoRequest("payment_intents", {
      data: { attributes: {
        amount: Math.round(order.total * 100),
        currency: "PHP",
        payment_method_allowed: ["gcash"],
        description: `AgriMarket order ${orderId}`,
        metadata: { order_id: orderId },
      } },
    }, `agrimarket-order-${orderId}`);
    const intentId = order.paymentIntentId ?? intent?.data?.id;
    const clientKey = order.paymentClientKey ?? intent?.data?.attributes?.client_key;
    if (!intentId || !clientKey) throw new Error("PayMongo returned an invalid payment intent");

    const method = order.paymentMethodId ? null : await paymongoRequest("payment_methods", {
      data: { attributes: {
        type: "gcash",
        billing: { name: "AgriMarket buyer", email: identity.email, address: { country: "PH" } },
        metadata: { order_id: orderId },
      } },
    }, `agrimarket-method-${orderId}`);
    const methodId = order.paymentMethodId ?? method?.data?.id;
    if (!methodId) throw new Error("PayMongo returned an invalid payment method");

    const attached = await paymongoRequest(`payment_intents/${intentId}/attach`, {
      data: { attributes: { payment_method: methodId, client_key: clientKey, return_url: args.returnUrl } },
    }, `agrimarket-attach-${orderId}`);
    const redirectUrl = attached.data?.attributes?.next_action?.redirect?.url;
    if (!redirectUrl) throw new Error("PayMongo did not return a GCash redirect URL");

    await ctx.runMutation(internal.payments.savePaymentIntent, {
      orderId,
      intentId,
      clientKey,
      methodId,
      redirectUrl,
    });
    return { orderId, redirectUrl };
  },
});
