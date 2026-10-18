'use client';

import { Alert, Button, Empty, Input, Skeleton } from 'antd';
import { MessageOutlined, SendOutlined } from '@ant-design/icons';
import { useMessages } from '@/hooks/useMessages';
import { formatOrderTime } from '@/lib/format';

interface MessagesViewProps { seller?: boolean }

export function MessagesView({ seller = false }: MessagesViewProps) {
  const { conversations, isLoading, error, selectedId, thread, draft, setDraft, isSending, sendMessage, openConversation } = useMessages(seller);

  if (isLoading) return <div className="mx-auto max-w-6xl space-y-5 px-4 py-8 sm:px-6"><Skeleton active paragraph={{ rows: 7 }} /></div>;

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6 sm:py-10">
      <div><h1 className="font-display text-3xl text-stone-900">Messages</h1><p className="mt-1 text-sm text-stone-500">Talk with {seller ? 'your customers' : 'the shops you buy from'}.</p></div>
      {error && <Alert type="error" title={error} showIcon />}
      <div className="grid min-h-[32rem] grid-cols-1 gap-4 lg:grid-cols-12">
        <aside className="rounded-2xl bg-white p-3 shadow-sm lg:col-span-4">
          {conversations.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No conversations yet" /> : conversations.map(({ conversation, partnerName, stallName, lastMessage, unreadCount }) => (
            <button key={conversation._id} type="button" onClick={() => openConversation(conversation._id)} className={`mb-1 w-full rounded-xl p-3 text-left transition-colors ${selectedId === conversation._id ? 'bg-sage-soft' : 'hover:bg-stone-50'}`}>
              <div className="flex items-center justify-between gap-2"><span className="truncate text-sm font-semibold text-stone-900">{seller ? partnerName : stallName}</span><span className="flex shrink-0 items-center gap-2">{unreadCount > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-sage px-1.5 text-[10px] font-semibold text-white">{unreadCount > 99 ? '99+' : unreadCount}</span>}{lastMessage && <span className="text-[10px] text-stone-400">{formatOrderTime(lastMessage.createdAt)}</span>}</span></div>
              <p className="mt-1 truncate text-xs text-stone-500">{lastMessage?.body ?? 'Start the conversation'}</p>
            </button>
          ))}
        </aside>
        <section className="flex min-h-[25rem] flex-col rounded-2xl bg-white p-4 shadow-sm sm:p-6 lg:col-span-8">
          {!selectedId || !thread ? <div className="flex flex-1 items-center justify-center"><Empty image={<MessageOutlined className="text-3xl text-stone-300" />} description="Choose a conversation to read and reply." /></div> : <>
            <header className="border-b border-stone-100 pb-4"><h2 className="font-semibold text-stone-900">{seller ? thread.partnerName : thread.stallName}</h2><p className="text-xs text-stone-500">{seller ? thread.stallName : 'Shop conversation'}{thread.conversation.orderId ? ` · Order ${thread.conversation.orderId}` : ''}</p></header>
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto py-5">
              {thread.messages.length === 0 ? <p className="m-auto text-sm text-stone-400">No messages yet. Say hello to get started.</p> : thread.messages.map((item) => {
                const mine = item.senderId === (seller ? thread.conversation.sellerId : thread.conversation.buyerId);
                const senderLabel = item.senderId === thread.conversation.sellerId ? thread.stallName : item.senderName;
                return <div key={item._id} className={`max-w-[88%] rounded-2xl px-4 py-3 sm:max-w-[75%] ${mine ? 'ml-auto bg-sage-soft text-stone-800' : 'mr-auto bg-stone-50 text-stone-800'}`}><p className="mb-1 text-[11px] text-stone-500">{senderLabel} · {formatOrderTime(item.createdAt)}</p><p className="whitespace-pre-wrap break-words text-sm">{item.body}</p></div>;
              })}
            </div>
            <div className="flex items-end gap-2 border-t border-stone-100 pt-4"><Input.TextArea value={draft} onChange={(event) => setDraft(event.target.value)} onPressEnter={(event) => { if (!event.shiftKey) { event.preventDefault(); void sendMessage(); } }} autoSize={{ minRows: 1, maxRows: 4 }} maxLength={2000} placeholder="Write a message…" aria-label="Write a message" /><Button type="primary" icon={<SendOutlined />} aria-label="Send message" loading={isSending} disabled={!draft.trim()} onClick={() => void sendMessage()} /></div>
          </>}
        </section>
      </div>
    </div>
  );
}
