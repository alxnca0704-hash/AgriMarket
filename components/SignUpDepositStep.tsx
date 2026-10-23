'use client';

import { Alert, Button, Image, Input, InputNumber, Skeleton, App } from 'antd';
import { makeFunctionReference } from 'convex/server';
import { useQuery } from 'convex/react';
import { SELLER_DEPOSIT_AMOUNT } from '@/constants/deposits';
import { formatPrice } from '@/lib/format';

const gcashRef = makeFunctionReference<'query', Record<string, never>, { qrUrl: string; number: string } | null>('deposits:getPublicGcashSettings');
interface Props { amount: number | null; reference: string; skipped: boolean; onAmount: (amount: number | null) => void; onReference: (value: string) => void; onSkip: () => void }
export function SignUpDepositStep({ amount, reference, skipped, onAmount, onReference, onSkip }: Props) {
  const { message } = App.useApp();
  const gcash = useQuery(gcashRef, {});
  if (gcash === undefined) return <Skeleton active paragraph={{ rows: 5 }} />;
  return <div className="space-y-4"><div><h2 className="text-xl font-semibold">Activate your stall</h2><p className="mt-1 text-sm text-stone-500">Submit a full or partial GCash deposit now, or pay later from your stall page.</p></div><Alert type="info" showIcon title={`Required deposit: ${formatPrice(SELLER_DEPOSIT_AMOUNT)}`} description="Your stall will stay hidden from buyers until the full amount is approved." />
    {gcash ? <div className="flex flex-wrap items-center gap-4 rounded-xl bg-stone-50 p-4"><Image src={gcash.qrUrl} alt="GCash QR code" className="!max-h-48 object-contain" /><div><p className="text-sm text-stone-500">GCash account</p><p className="font-semibold">{gcash.number}</p><div className="mt-2 flex gap-2"><Button size="small" href={gcash.qrUrl} target="_blank">Download QR</Button><Button size="small" onClick={async () => { await navigator.clipboard.writeText(gcash.number); message.success('GCash number copied.'); }}>Copy number</Button></div></div></div> : <Alert type="warning" title="GCash payment details are not configured." />}
    {!skipped && <div className="space-y-3"><InputNumber min={0.01} max={SELLER_DEPOSIT_AMOUNT} value={amount} onChange={onAmount} className="!w-full" placeholder="Amount sent (₱)" />{amount && amount === SELLER_DEPOSIT_AMOUNT ? <Alert type="success" title="Full deposit" /> : amount && amount > 0 && amount < SELLER_DEPOSIT_AMOUNT ? <Alert type="warning" title={`Partial deposit. You still need to pay ${formatPrice(SELLER_DEPOSIT_AMOUNT - amount)} to activate your stall.`} /> : null}<Input value={reference} onChange={event => onReference(event.target.value)} placeholder="GCash transaction reference number" /></div>}
    <Button type="default" onClick={onSkip}>{skipped ? 'Deposit skipped — click to pay now' : 'Skip for now'}</Button>{!skipped && <p className="text-xs text-stone-500">You have 7 days to complete your ₱2,000 deposit from your stall page.</p>}
  </div>;
}
