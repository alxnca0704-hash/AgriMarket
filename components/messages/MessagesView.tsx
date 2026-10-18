'use client';

import { Alert, Skeleton } from 'antd';
import { useMessages } from '@/hooks/useMessages';
import { MessagesInboxView } from '@/components/messages/MessagesInboxView';
import { MessagesChatRoomView } from '@/components/messages/MessagesChatRoomView';

export interface MessagesViewProps {
  seller?: boolean;
}

export function MessagesView({ seller = false }: MessagesViewProps) {
  const {
    conversations,
    filteredConversations,
    unreadCount,
    unreadConversationsCount,
    orderConversationsCount,
    filterTab,
    setFilterTab,
    search,
    setSearch,
    isLoading,
    error,
    selectedId,
    thread,
    draft,
    setDraft,
    isSending,
    sendMessage,
    openConversation,
    backToConversations,
    quickReplies,
    applyQuickReply,
  } = useMessages(seller);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-5 px-4 py-8 sm:px-6">
        <Skeleton active paragraph={{ rows: 2 }} />
        <div className="space-y-3 pt-4">
          <Skeleton.Button active block style={{ height: 42, borderRadius: 12 }} />
          <Skeleton.Button active block style={{ height: 84, borderRadius: 16 }} />
          <Skeleton.Button active block style={{ height: 84, borderRadius: 16 }} />
          <Skeleton.Button active block style={{ height: 84, borderRadius: 16 }} />
        </div>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mx-auto max-w-4xl px-4 pt-6 sm:px-6">
          <Alert type="error" title={error} showIcon className="!rounded-xl" />
        </div>
      )}

      {selectedId && thread ? (
        <MessagesChatRoomView
          seller={seller}
          thread={thread}
          draft={draft}
          setDraft={setDraft}
          isSending={isSending}
          onSendMessage={sendMessage}
          onBackToInbox={backToConversations}
          quickReplies={quickReplies}
          onApplyQuickReply={applyQuickReply}
          allConversations={conversations}
          onSelectConversation={openConversation}
        />
      ) : (
        <MessagesInboxView
          seller={seller}
          conversations={conversations}
          filteredConversations={filteredConversations}
          search={search}
          setSearch={setSearch}
          filterTab={filterTab}
          setFilterTab={setFilterTab}
          unreadCount={unreadCount}
          unreadConversationsCount={unreadConversationsCount}
          orderConversationsCount={orderConversationsCount}
          onSelectConversation={openConversation}
        />
      )}
    </div>
  );
}
