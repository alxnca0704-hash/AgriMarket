import { OrderStatus } from '@/types/order';

export const PAYMENT_METHOD = {
  COD: 'cod',
  GCASH: 'gcash',
} as const;

export type PaymentMethod = (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  'to-receive': 'To receive',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
  'refund-requested': 'Return Requested',
  'seller-rejected': 'Seller Rejected',
  escalated: 'Escalated to Admin',
  'return-approved': 'Return Approved',
  'return-in-transit': 'Return In Transit',
  'return-received': 'Return Received',
  'repayment-submitted': 'Refund Sent',
  'buyer-confirmed': 'Buyer Confirmed',
  'buyer-disputed': 'Buyer Disputed',
  refunded: 'Refunded',
};

export const ORDER_STATUS_TAG_COLORS: Record<OrderStatus, string> = {
  pending: 'gold',
  confirmed: 'processing',
  'to-receive': 'geekblue',
  delivered: 'cyan',
  completed: 'success',
  cancelled: 'default',
  'refund-requested': 'orange',
  'seller-rejected': 'red',
  escalated: 'volcano',
  'return-approved': 'blue',
  'return-in-transit': 'processing',
  'return-received': 'cyan',
  'repayment-submitted': 'geekblue',
  'buyer-confirmed': 'cyan',
  'buyer-disputed': 'red',
  refunded: 'success',
};

export const ORDER_LIST_FILTERS = [
  { key: 'active', label: 'In progress' },
  { key: 'past', label: 'Past orders' },
  { key: 'returns', label: 'Returns' },
  { key: 'all', label: 'All orders' },
] as const;

export type OrderListFilter = (typeof ORDER_LIST_FILTERS)[number]['key'];

export const ORDER_FILTER_STATUSES: Record<Exclude<OrderListFilter, 'all'>, OrderStatus[]> = {
  active: ['pending', 'confirmed', 'to-receive', 'delivered'],
  past: ['completed', 'cancelled'],
  returns: ['refund-requested', 'seller-rejected', 'escalated', 'return-approved', 'return-in-transit', 'return-received', 'repayment-submitted', 'buyer-confirmed', 'buyer-disputed', 'refunded'],
};

export const ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'to-receive',
  'delivered',
  'completed',
  'cancelled',
  'refund-requested',
  'seller-rejected',
  'escalated',
  'return-approved',
  'return-in-transit',
  'return-received',
  'repayment-submitted',
  'buyer-confirmed',
  'buyer-disputed',
  'refunded',
];

export const ORDER_ACTIONS = {
  confirmOrder: 'confirmOrder',
  rejectOrder: 'rejectOrder',
  dispatchOrder: 'dispatchOrder',
  completeOrder: 'completeOrder',
  cancelOrder: 'cancelOrder',
  confirmDelivery: 'confirmDelivery',
  requestRefund: 'requestRefund',
  submitReturnShipment: 'submitReturnShipment',
  confirmReturnReceived: 'confirmReturnReceived',
  approveCodReturn: 'approveCodReturn',
  rejectCodReturn: 'rejectCodReturn',
  reportCodReturnIssue: 'reportCodReturnIssue',
  submitCodRepayment: 'submitCodRepayment',
  reportCodNumberIssue: 'reportCodNumberIssue',
  revealCodRefundNumber: 'revealCodRefundNumber',
  escalateCodRefund: 'escalateCodRefund',
  confirmCodRefundReceived: 'confirmCodRefundReceived',
  disputeCodRefund: 'disputeCodRefund',
  updateCodRefundNumber: 'updateCodRefundNumber',
} as const;

export type OrderAction = (typeof ORDER_ACTIONS)[keyof typeof ORDER_ACTIONS];

export const ORDER_ACTION_KEYS: Record<OrderAction, (orderId: string) => string> = {
  confirmOrder: (orderId) => `${ORDER_ACTIONS.confirmOrder}:${orderId}`,
  rejectOrder: (orderId) => `${ORDER_ACTIONS.rejectOrder}:${orderId}`,
  dispatchOrder: (orderId) => `${ORDER_ACTIONS.dispatchOrder}:${orderId}`,
  completeOrder: (orderId) => `${ORDER_ACTIONS.completeOrder}:${orderId}`,
  cancelOrder: (orderId) => `${ORDER_ACTIONS.cancelOrder}:${orderId}`,
  confirmDelivery: (orderId) => `${ORDER_ACTIONS.confirmDelivery}:${orderId}`,
  requestRefund: (orderId) => `${ORDER_ACTIONS.requestRefund}:${orderId}`,
  submitReturnShipment: (orderId) => `${ORDER_ACTIONS.submitReturnShipment}:${orderId}`,
  confirmReturnReceived: (orderId) => `${ORDER_ACTIONS.confirmReturnReceived}:${orderId}`,
  approveCodReturn: (orderId) => `${ORDER_ACTIONS.approveCodReturn}:${orderId}`,
  rejectCodReturn: (orderId) => `${ORDER_ACTIONS.rejectCodReturn}:${orderId}`,
  reportCodReturnIssue: (orderId) => `${ORDER_ACTIONS.reportCodReturnIssue}:${orderId}`,
  submitCodRepayment: (orderId) => `${ORDER_ACTIONS.submitCodRepayment}:${orderId}`,
  reportCodNumberIssue: (orderId) => `${ORDER_ACTIONS.reportCodNumberIssue}:${orderId}`,
  revealCodRefundNumber: (orderId) => `${ORDER_ACTIONS.revealCodRefundNumber}:${orderId}`,
  escalateCodRefund: (orderId) => `${ORDER_ACTIONS.escalateCodRefund}:${orderId}`,
  confirmCodRefundReceived: (orderId) => `${ORDER_ACTIONS.confirmCodRefundReceived}:${orderId}`,
  disputeCodRefund: (orderId) => `${ORDER_ACTIONS.disputeCodRefund}:${orderId}`,
  updateCodRefundNumber: (orderId) => `${ORDER_ACTIONS.updateCodRefundNumber}:${orderId}`,
};
