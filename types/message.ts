import { Id } from '@/convex/_generated/dataModel';

export type MessageFilterType = 'all' | 'unread' | 'orders';

export interface ConversationSummary {
  _id: Id<'conversations'>;
  _creationTime: number;
  buyerId: Id<'users'>;
  sellerId: Id<'users'>;
  stallId: Id<'stalls'>;
  orderId?: Id<'orders'>;
  buyerLastReadAt?: string;
  sellerLastReadAt?: string;
  buyerUnreadCount?: number;
  sellerUnreadCount?: number;
  updatedAt: string;
}

export interface ConversationListItem {
  conversation: ConversationSummary;
  partnerName: string;
  stallName: string;
  lastMessage: {
    body: string;
    createdAt: string;
  } | null;
  unreadCount: number;
}

export interface MessageRecord {
  _id: Id<'messages'>;
  _creationTime: number;
  conversationId: Id<'conversations'>;
  senderId: Id<'users'>;
  senderName: string;
  body: string;
  createdAt: string;
}

export interface OrderInquirySummary {
  _id: Id<'orders'>;
  status: string;
  total: number;
  itemsCount: number;
  firstItemName: string;
  placedAt: string;
}

export interface ConversationThreadData {
  conversation: ConversationSummary;
  partnerName: string;
  stallName: string;
  orderSummary?: OrderInquirySummary;
  messages: MessageRecord[];
}
