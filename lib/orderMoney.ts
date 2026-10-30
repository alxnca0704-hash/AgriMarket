import { getNetPayoutAmount } from '@/constants/payouts';

export interface GcashNetOrder {
  netPayoutAmount?: number | null;
  itemsSubtotal: number;
  deliveryFee: number;
  commissionAmount: number;
}

export function getGcashNetToSeller(order: GcashNetOrder): number {
  return getNetPayoutAmount({
    subtotal: order.itemsSubtotal,
    deliveryFee: order.deliveryFee,
    commissionAmount: order.commissionAmount,
    netPayoutAmount: order.netPayoutAmount ?? undefined,
  });
}
