export interface GcashNetOrder {
  netPayoutAmount?: number | null;
  itemsSubtotal: number;
  deliveryFee: number;
  commissionAmount: number;
}

export function getGcashNetToSeller(order: GcashNetOrder): number {
  if (order.netPayoutAmount !== undefined && order.netPayoutAmount !== null) return order.netPayoutAmount;
  return Math.round((order.itemsSubtotal + order.deliveryFee - order.commissionAmount) * 100) / 100;
}
