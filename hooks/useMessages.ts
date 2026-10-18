'use client';

import { useEffect, useState } from 'react';
import { App } from 'antd';
import { useMutation, useQuery } from 'convex/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { APP_ROUTES } from '@/constants/routes';

export function useMessages(seller = false) {
  const { message } = App.useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get('conversation');
  const conversations = useQuery(api.messages.listMine);
  const thread = useQuery(api.messages.getThread, selectedId ? { conversationId: selectedId as Id<'conversations'> } : 'skip');
  const sendMutation = useMutation(api.messages.sendMessage);
  const startMutation = useMutation(api.messages.startConversation);
  const markReadMutation = useMutation(api.messages.markRead);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (!selectedId || !thread) return;
    const readAt = seller ? thread.conversation.sellerLastReadAt : thread.conversation.buyerLastReadAt;
    if (readAt && readAt >= thread.conversation.updatedAt) return;
    void markReadMutation({ conversationId: selectedId as Id<'conversations'> }).catch((error: unknown) => {
      message.error(error instanceof Error ? error.message : 'Could not update message status.');
    });
  }, [markReadMutation, message, selectedId, seller, thread]);

  const openConversation = (id: string) => {
    router.push(seller ? APP_ROUTES.sellerMessageThread(id) : APP_ROUTES.messageThread(id));
  };

  const conversationList = Array.isArray(conversations) ? conversations : [];
  const unreadCount = conversationList.reduce((total, item) => total + item.unreadCount, 0);

  const startConversation = async (stallId: string, orderId?: string) => {
    setIsStarting(true);
    try {
      const id = await startMutation({ stallId: stallId as Id<'stalls'>, ...(orderId ? { orderId: orderId as Id<'orders'> } : {}) });
      openConversation(id);
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Could not open messages.');
    } finally {
      setIsStarting(false);
    }
  };

  const sendMessage = async () => {
    const body = draft.trim();
    if (!selectedId || !body || isSending) return;
    setIsSending(true);
    try {
      await sendMutation({ conversationId: selectedId as Id<'conversations'>, body });
      setDraft('');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Could not send message.');
    } finally {
      setIsSending(false);
    }
  };

  return {
    conversations: conversationList,
    unreadCount,
    isLoading: conversations === undefined || (selectedId !== null && thread === undefined),
    error: conversations instanceof Error ? conversations.message : thread instanceof Error ? thread.message : null,
    selectedId,
    thread: thread && !(thread instanceof Error) ? thread : null,
    draft,
    setDraft,
    isSending,
    isStarting,
    sendMessage,
    startConversation,
    openConversation,
  };
}
