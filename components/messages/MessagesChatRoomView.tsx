'use client';

import { useEffect, useRef, useState } from 'react';
import { Button, Drawer, Input, Tag, Tooltip } from 'antd';
import {
  ArrowLeftOutlined,
  CheckOutlined,
  MessageOutlined,
  SendOutlined,
  ShopOutlined,
  ShoppingOutlined,
  SwapOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { APP_ROUTES } from '@/constants/routes';
import { MAX_MESSAGE_LENGTH } from '@/constants/messages';
import {
  formatMessageDateGroup,
  formatMessageTime,
  formatPrice,
} from '@/lib/format';
import {
  ConversationListItem,
  ConversationThreadData,
  MessageRecord,
} from '@/types/message';

export interface MessagesChatRoomViewProps {
  seller?: boolean;
  thread: ConversationThreadData;
  draft: string;
  setDraft: (val: string) => void;
  isSending: boolean;
  onSendMessage: () => Promise<void>;
  onBackToInbox: () => void;
  quickReplies: readonly string[];
  onApplyQuickReply: (text: string) => void;
  allConversations?: ConversationListItem[];
  onSelectConversation?: (id: string) => void;
}

function ChatAvatar({ seller, label }: { seller: boolean; label: string }) {
  const initial = label.trim().charAt(0).toUpperCase();
  return (
    <span
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-base font-semibold ${
        seller ? 'bg-stone-100 text-stone-700' : 'bg-sage-soft text-sage'
      }`}
    >
      {initial || (seller ? <UserOutlined /> : <ShopOutlined />)}
    </span>
  );
}

export function MessagesChatRoomView({
  seller = false,
  thread,
  draft,
  setDraft,
  isSending,
  onSendMessage,
  onBackToInbox,
  quickReplies,
  onApplyQuickReply,
  allConversations = [],
  onSelectConversation,
}: MessagesChatRoomViewProps) {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { conversation, partnerName, stallName, messages, orderSummary } = thread;
  const partnerTitle = seller ? partnerName : stallName;
  const partnerRole = seller ? 'Customer / Buyer' : `Direct Farm Shop · ${stallName}`;
  const orderId = conversation.orderId;

  // Auto-scroll to bottom on mount and message updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, conversation._id]);

  // Group messages by date
  const groupedMessages: { dateLabel: string; items: MessageRecord[] }[] = [];
  messages.forEach((msg) => {
    const dateLabel = formatMessageDateGroup(msg.createdAt);
    const existingGroup = groupedMessages.find((g) => g.dateLabel === dateLabel);
    if (existingGroup) {
      existingGroup.items.push(msg);
    } else {
      groupedMessages.push({ dateLabel, items: [msg] });
    }
  });

  const handleQuickReply = (text: string) => {
    onApplyQuickReply(text);
    if (textAreaRef.current) {
      textAreaRef.current.focus();
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 pb-8 pt-4 sm:px-6 sm:pt-6">
      {/* Top Header Card */}
      <header className="mb-4 flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm sm:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={onBackToInbox}
            aria-label="Back to inbox"
            className="!h-9 !rounded-xl !px-3 font-medium text-stone-600 hover:!bg-stone-100"
          >
            <span className="hidden sm:inline">Inbox</span>
          </Button>

          <ChatAvatar seller={seller} label={partnerTitle} />

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-base font-semibold text-stone-900 sm:text-lg">
                {partnerTitle}
              </h1>
              <Tag
                className={`!m-0 !rounded-md !border-none !px-2 !py-0.5 !text-[10px] font-semibold ${
                  seller ? '!bg-stone-100 !text-stone-600' : '!bg-sage-soft !text-sage'
                }`}
              >
                {seller ? 'Buyer' : 'Farm Stall'}
              </Tag>
            </div>
            <p className="truncate text-xs text-stone-400">{partnerRole}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {allConversations.length > 1 && onSelectConversation && (
            <Tooltip title="Switch conversation">
              <Button
                type="text"
                icon={<SwapOutlined />}
                onClick={() => setDrawerOpen(true)}
                className="!h-9 !rounded-xl !px-3 text-stone-600 hover:!bg-stone-100"
              >
                <span className="hidden md:inline">Other chats</span>
              </Button>
            </Tooltip>
          )}

          {orderId && (
            <Button
              icon={<ShoppingOutlined className="text-sage" />}
              href={
                seller
                  ? APP_ROUTES.sellerOrderDetail(orderId)
                  : APP_ROUTES.orderDetail(orderId)
              }
              className="!h-9 !rounded-xl"
            >
              <span className="hidden sm:inline">Order details</span>
            </Button>
          )}
        </div>
      </header>

      {/* Order Context Banner */}
      {orderId && (
        <section
          aria-label="Linked order details"
          className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-5 py-3.5 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sage-soft text-sage">
              <ShoppingOutlined />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-stone-800">
                  Order #{orderId.slice(-8).toUpperCase()}
                </span>
                {orderSummary && (
                  <Tag className="!m-0 !rounded-md !border-none !bg-stone-100 !text-stone-700 !text-[11px] font-medium uppercase tracking-wide">
                    {orderSummary.status}
                  </Tag>
                )}
              </div>
              <p className="text-xs text-stone-400">
                {orderSummary
                  ? `${orderSummary.itemsCount} item(s) (${orderSummary.firstItemName}) · Total ${formatPrice(orderSummary.total)}`
                  : 'This conversation is directly linked to an order.'}
              </p>
            </div>
          </div>

          <Button
            size="small"
            type="link"
            href={
              seller
                ? APP_ROUTES.sellerOrderDetail(orderId)
                : APP_ROUTES.orderDetail(orderId)
            }
            className="!p-0 !text-xs !font-semibold !text-sage"
          >
            View full order →
          </Button>
        </section>
      )}

      {/* Main Chat Stream Card */}
      <div className="flex flex-col rounded-2xl bg-white shadow-sm overflow-hidden">
        {/* Messages List Area */}
        <div
          aria-label="Message stream"
          className="flex h-[calc(100dvh-20rem)] min-h-[22rem] sm:min-h-[26rem] flex-col overflow-y-auto bg-stone-50/60 p-4 sm:p-6"
        >
          {messages.length === 0 ? (
            <div className="m-auto flex max-w-sm flex-col items-center justify-center py-10 text-center">
              <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl text-sage shadow-sm">
                <MessageOutlined />
              </span>
              <h2 className="text-sm font-semibold text-stone-800">
                Start your conversation
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-stone-500">
                {seller
                  ? 'Send a friendly greeting or reply to the buyer’s inquiry about harvest and orders.'
                  : 'Ask about seasonal availability, delivery schedules, or special requests.'}
              </p>
            </div>
          ) : (
            <div className="mt-auto flex flex-col gap-4">
              {groupedMessages.map(({ dateLabel, items }) => (
                <div key={dateLabel} className="space-y-3">
                  {/* Date separator */}
                  <div className="flex justify-center">
                    <span className="rounded-full bg-stone-200/60 px-3 py-0.5 text-[10px] font-medium uppercase tracking-wide text-stone-500">
                      {dateLabel}
                    </span>
                  </div>

                  {/* Messages in this group */}
                  {items.map((item) => {
                    const isMine =
                      item.senderId ===
                      (seller ? conversation.sellerId : conversation.buyerId);
                    const senderLabel =
                      item.senderId === conversation.sellerId
                        ? stallName
                        : item.senderName;

                    return (
                      <article
                        key={item._id}
                        className={`flex flex-col ${
                          isMine ? 'items-end' : 'items-start'
                        }`}
                      >
                        {!isMine && (
                          <span className="mb-1 pl-1 text-[11px] font-medium text-stone-500">
                            {senderLabel}
                          </span>
                        )}

                        <div
                          className={`max-w-[85%] sm:max-w-[72%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-xs ${
                            isMine
                              ? 'rounded-tr-xs bg-sage text-white'
                              : 'rounded-tl-xs bg-white text-stone-800'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{item.body}</p>
                        </div>

                        <div
                          className={`mt-1 flex items-center gap-1 px-1 text-[10px] ${
                            isMine ? 'text-stone-400' : 'text-stone-400'
                          }`}
                        >
                          <span>{formatMessageTime(item.createdAt)}</span>
                          {isMine && <CheckOutlined className="text-[10px] text-sage" />}
                        </div>
                      </article>
                    );
                  })}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Quick Replies Bar */}
        <section aria-label="Quick replies" className="border-t border-stone-100 bg-white px-4 py-2.5 sm:px-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="shrink-0 text-[11px] font-medium text-stone-400">
              Suggestions:
            </span>
            {quickReplies.map((reply) => (
              <button
                key={reply}
                type="button"
                onClick={() => handleQuickReply(reply)}
                className="shrink-0 rounded-full bg-stone-100 px-3 py-1 text-stone-600 transition hover:bg-sage-soft hover:text-sage focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sage"
              >
                {reply}
              </button>
            ))}
          </div>
        </section>

        {/* Message Composer Form */}
        <footer className="border-t border-stone-100 bg-white p-3 sm:p-4">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void onSendMessage();
            }}
            className="space-y-2"
          >
            <div className="flex items-end gap-2.5">
              <Input.TextArea
                ref={textAreaRef as never}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onPressEnter={(event) => {
                  if (!event.shiftKey) {
                    event.preventDefault();
                    void onSendMessage();
                  }
                }}
                autoSize={{ minRows: 1, maxRows: 4 }}
                maxLength={MAX_MESSAGE_LENGTH}
                placeholder={
                  seller
                    ? `Message ${partnerName}…`
                    : `Message ${stallName}…`
                }
                aria-label="Message draft input"
                className="!rounded-xl"
              />

              <Button
                htmlType="submit"
                type="primary"
                icon={<SendOutlined />}
                loading={isSending}
                disabled={!draft.trim()}
                aria-label="Send message"
                className="!h-10 !w-10 !rounded-xl !p-0 shrink-0"
              />
            </div>

            <div className="flex items-center justify-between px-1 text-[11px] text-stone-400">
              <span className="hidden sm:inline">
                Press <kbd className="rounded bg-stone-100 px-1 py-0.5 text-stone-600 font-mono text-[10px]">Enter</kbd> to send, <kbd className="rounded bg-stone-100 px-1 py-0.5 text-stone-600 font-mono text-[10px]">Shift + Enter</kbd> for new line
              </span>
              <span className="ml-auto tabular-nums">
                {draft.length} / {MAX_MESSAGE_LENGTH}
              </span>
            </div>
          </form>
        </footer>
      </div>

      {/* Switch Conversation Drawer (for desktop/tablet quick access) */}
      <Drawer
        title="Your Conversations"
        placement="right"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        styles={{ body: { padding: '12px' } }}
      >
        <div className="space-y-2">
          {allConversations.map((item) => {
            const isCurrent = item.conversation._id === conversation._id;
            const title = seller ? item.partnerName : item.stallName;
            return (
              <button
                key={item.conversation._id}
                type="button"
                onClick={() => {
                  onSelectConversation?.(item.conversation._id);
                  setDrawerOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${
                  isCurrent ? 'bg-sage-soft text-sage' : 'hover:bg-stone-50'
                }`}
              >
                <ChatAvatar seller={seller} label={title} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-stone-900">{title}</p>
                  <p className="truncate text-xs text-stone-400">
                    {item.lastMessage?.body || 'No messages yet'}
                  </p>
                </div>
                {item.unreadCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-sage px-1.5 text-[10px] font-semibold text-white">
                    {item.unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Drawer>
    </div>
  );
}
