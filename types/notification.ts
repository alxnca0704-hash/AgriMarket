export type NotificationType =
  | 'order_placed'
  | 'order_confirmed'
  | 'order_dispatched'
  | 'order_delivered'
  | 'order_completed'
  | 'order_cancelled'
  | 'refund_requested'
  | 'return_approved'
  | 'return_in_transit'
  | 'return_received'
  | 'refunded'
  | 'refund_rejected'
  | 'payment_approved'
  | 'payment_rejected'
  | 'low_stock'
  | 'new_review'
  | (string & {});

export interface AppNotification {
  id: string;
  userId: string;
  role?: 'buyer' | 'seller';
  orderId?: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export type NotificationFilterTab = 'all' | 'unread' | 'orders' | 'returns';
