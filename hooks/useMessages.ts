'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { App } from 'antd';
import { useMutation, useQuery } from 'convex/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { APP_ROUTES } from '@/constants/routes';
import { BUYER_QUICK_REPLIES, SELLER_QUICK_REPLIES } from '@/constants/messages';
import {
  ConversationListItem,
  ConversationThreadData,
  MessageFilterType,
} from '@/types/message';

export function useMessages(seller = false) {
  const { message } = App.useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get('conversation');

  const conversations = useQuery(api.messages.listMine);
  const thread = useQuery(
    api.messages.getThread,
    selectedId ? { conversationId: selectedId as Id<'conversations'> } : 'skip'
  );

  const sendMutation = useMutation(api.messages.sendMessage);
  const startMutation = useMutation(api.messages.startConversation);
  const markReadMutation = useMutation(api.messages.markRead);

  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<MessageFilterType>('all');

  useEffect(() => {
    if (!selectedId || !thread) return;
    const readAt = seller
      ? thread.conversation.sellerLastReadAt
      : thread.conversation.buyerLastReadAt;
    if (readAt && readAt >= thread.conversation.updatedAt) return;
    void markReadMutation({ conversationId: selectedId as Id<'conversations'> }).catch((error: unknown) => {
      message.error(error instanceof Error ? error.message : 'Could not update message status.');
    });
  }, [markReadMutation, message, selectedId, seller, thread]);

  const openConversation = useCallback(
    (id: string) => {
      router.push(seller ? APP_ROUTES.sellerMessageThread(id) : APP_ROUTES.messageThread(id));
    },
    [router, seller]
  );

  const backToConversations = useCallback(() => {
    router.push(seller ? APP_ROUTES.sellerMessages : APP_ROUTES.messages);
  }, [router, seller]);

  const conversationList: ConversationListItem[] = useMemo(
    () => (Array.isArray(conversations) ? (conversations as ConversationListItem[]) : []),
    [conversations]
  );

  const unreadCount = useMemo(
    () => conversationList.reduce((total, item) => total + item.unreadCount, 0),
    [conversationList]
  );

  const unreadConversationsCount = useMemo(
    () => conversationList.filter((item) => item.unreadCount > 0).length,
    [conversationList]
  );

  const orderConversationsCount = useMemo(
    () => conversationList.filter((item) => Boolean(item.conversation.orderId)).length,
    [conversationList]
  );

  const filteredConversations = useMemo(() => {
    let result = conversationList;

    if (filterTab === 'unread') {
      result = result.filter((item) => item.unreadCount > 0);
    } else if (filterTab === 'orders') {
      result = result.filter((item) => Boolean(item.conversation.orderId));
    }

    const term = search.trim().toLowerCase();
    if (!term) return result;

    return result.filter((item) =>
      `${item.partnerName} ${item.stallName} ${item.lastMessage?.body ?? ''}`
        .toLowerCase()
        .includes(term)
    );
  }, [conversationList, filterTab, search]);

  const startConversation = async (stallId: string, orderId?: string) => {
    setIsStarting(true);
    try {
      const id = await startMutation({
        stallId: stallId as Id<'stalls'>,
        ...(orderId ? { orderId: orderId as Id<'orders'> } : {}),
      });
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

  const applyQuickReply = (text: string) => {
    setDraft((prev) => (prev ? `${prev} ${text}` : text));
  };

  const quickReplies = seller ? SELLER_QUICK_REPLIES : BUYER_QUICK_REPLIES;

  return {
    conversations: conversationList,
    filteredConversations,
    unreadCount,
    unreadConversationsCount,
    orderConversationsCount,
    filterTab,
    setFilterTab,
    search,
    setSearch,
    isLoading: conversations === undefined || (selectedId !== null && thread === undefined),
    error:
      conversations instanceof Error
        ? conversations.message
        : thread instanceof Error
          ? thread.message
          : null,
    selectedId,
    thread: thread && !(thread instanceof Error) ? (thread as ConversationThreadData) : null,
    draft,
    setDraft,
    isSending,
    isStarting,
    sendMessage,
    startConversation,
    openConversation,
    backToConversations,
    quickReplies,
    applyQuickReply,
  };
}
