'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export function useUnreadMessages(): number {
  const conversations = useQuery(api.messages.listMine);
  if (!Array.isArray(conversations)) return 0;
  return conversations.reduce((total, conversation) => total + conversation.unreadCount, 0);
}
