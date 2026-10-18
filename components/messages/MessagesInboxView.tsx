'use client';

import { Button, Input, Tag } from 'antd';
import {
  ArrowRightOutlined,
  CheckCircleOutlined,
  MessageOutlined,
  SearchOutlined,
  ShopOutlined,
  ShoppingOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { APP_ROUTES } from '@/constants/routes';
import { MESSAGE_FILTER_TABS } from '@/constants/messages';
import { formatOrderTime } from '@/lib/format';
import { ConversationListItem, MessageFilterType } from '@/types/message';

export interface MessagesInboxViewProps {
  seller?: boolean;
  conversations: ConversationListItem[];
  filteredConversations: ConversationListItem[];
  search: string;
  setSearch: (value: string) => void;
  filterTab: MessageFilterType;
  setFilterTab: (tab: MessageFilterType) => void;
  unreadCount: number;
  unreadConversationsCount: number;
  orderConversationsCount: number;
  onSelectConversation: (id: string) => void;
}

function InboxAvatar({ seller, label }: { seller: boolean; label: string }) {
  const initial = label.trim().charAt(0).toUpperCase();
  return (
    <span
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg font-semibold transition-transform group-hover:scale-105 ${
        seller
          ? 'bg-stone-100 text-stone-700'
          : 'bg-sage-soft text-sage'
      }`}
    >
      {initial || (seller ? <UserOutlined /> : <ShopOutlined />)}
    </span>
  );
}

export function MessagesInboxView({
  seller = false,
  conversations,
  filteredConversations,
  search,
  setSearch,
  filterTab,
  setFilterTab,
  unreadCount,
  unreadConversationsCount,
  orderConversationsCount,
  onSelectConversation,
}: MessagesInboxViewProps) {
  const totalCount = conversations.length;

  return (
    <div className="mx-auto max-w-4xl px-4 pb-12 pt-5 sm:px-6 sm:pt-8">
      {/* Header */}
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sage">
            <MessageOutlined />
            <span>{seller ? 'Seller Inbox' : 'Direct Messages'}</span>
          </div>
          <h1 className="mt-1 font-display text-3xl tracking-tight text-stone-900 sm:text-4xl">
            Messages
          </h1>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-stone-500">
            {seller
              ? 'Respond to buyer inquiries, discuss fresh harvest, and coordinate customer orders.'
              : 'Connect directly with local farm stalls, ask about produce freshness, or follow up on orders.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
            <span className="font-semibold text-stone-900">{totalCount}</span> {totalCount === 1 ? 'chat' : 'chats'}
          </span>
          {unreadCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sage-soft px-3 py-1 text-xs font-semibold text-sage">
              <span className="h-1.5 w-1.5 rounded-full bg-sage" />
              {unreadCount} unread
            </span>
          )}
        </div>
      </header>

      {/* Search and Filters Bar */}
      <div className="mb-6 space-y-3">
        <div className="relative">
          <Input
            size="large"
            allowClear
            prefix={<SearchOutlined className="mr-1 text-stone-400" />}
            placeholder={
              seller
                ? 'Search by buyer name, stall name, or message content…'
                : 'Search by farm stall, message, or order…'
            }
            aria-label="Search conversations"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="!rounded-xl !bg-white !shadow-sm"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {MESSAGE_FILTER_TABS.map((tab) => {
            const isActive = filterTab === tab.key;
            let count = totalCount;
            if (tab.key === 'unread') count = unreadConversationsCount;
            if (tab.key === 'orders') count = orderConversationsCount;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilterTab(tab.key)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/40 ${
                  isActive
                    ? 'bg-sage text-white shadow-sm'
                    : 'bg-white text-stone-600 hover:bg-stone-100/80 shadow-xs'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-semibold tabular-nums ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Conversations List */}
      <main className="space-y-3" aria-label="Conversation list">
        {filteredConversations.length === 0 ? (
          totalCount === 0 ? (
            /* Brand new empty state */
            <div className="flex min-h-[22rem] flex-col items-center justify-center rounded-2xl bg-white p-8 text-center shadow-sm">
              <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sage-soft text-2xl text-sage">
                {seller ? <UserOutlined /> : <ShopOutlined />}
              </span>
              <h2 className="font-display text-2xl text-stone-800">
                {seller ? 'No customer inquiries yet' : 'No farm conversations yet'}
              </h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-stone-500">
                {seller
                  ? 'When customers message your farm stall with questions about your harvest or orders, their chats will arrive here in your inbox.'
                  : 'Start a direct chat from any shop profile to ask about seasonal crops, farm practices, or order fulfillment.'}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {!seller && (
                  <Button
                    type="primary"
                    href={APP_ROUTES.shops}
                    icon={<ShopOutlined />}
                    className="!h-10 !rounded-xl !px-5"
                  >
                    Browse farm shops
                  </Button>
                )}
                {seller && (
                  <Button
                    type="primary"
                    href={APP_ROUTES.sellerOrders}
                    icon={<ShoppingOutlined />}
                    className="!h-10 !rounded-xl !px-5"
                  >
                    View your orders
                  </Button>
                )}
              </div>
            </div>
          ) : (
            /* Search / Filter empty state */
            <div className="flex min-h-[16rem] flex-col items-center justify-center rounded-2xl bg-white p-8 text-center shadow-sm">
              <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
                <SearchOutlined className="text-xl" />
              </span>
              <h2 className="text-base font-semibold text-stone-800">
                No matching conversations
              </h2>
              <p className="mt-1 max-w-sm text-xs leading-relaxed text-stone-500">
                {search.trim()
                  ? `No conversations match "${search.trim()}". Try checking your spelling or clearing filters.`
                  : 'There are no conversations in this filter category.'}
              </p>
              <Button
                className="!mt-4 !rounded-xl"
                onClick={() => {
                  setSearch('');
                  setFilterTab('all');
                }}
              >
                Reset filters
              </Button>
            </div>
          )
        ) : (
          filteredConversations.map(
            ({ conversation, partnerName, stallName, lastMessage, unreadCount: itemUnread }) => {
              const displayName = seller ? partnerName : stallName;
              const hasUnread = itemUnread > 0;
              const hasOrder = Boolean(conversation.orderId);

              return (
                <div
                  key={conversation._id}
                  onClick={() => onSelectConversation(conversation._id)}
                  className={`group relative flex items-start gap-4 rounded-2xl bg-white p-4 shadow-sm transition-all hover:bg-stone-50/70 hover:shadow sm:items-center sm:p-5 cursor-pointer ${
                    hasUnread ? 'ring-1 ring-sage/20 bg-sage-soft/10' : ''
                  }`}
                >
                  <InboxAvatar seller={seller} label={displayName} />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-base font-semibold text-stone-900 group-hover:text-sage transition-colors">
                          {displayName}
                        </span>
                        <Tag
                          className={`!m-0 !rounded-md !border-none !px-2 !py-0.5 !text-[11px] font-medium ${
                            seller
                              ? '!bg-stone-100 !text-stone-600'
                              : '!bg-sage-soft !text-sage'
                          }`}
                        >
                          {seller ? 'Buyer' : 'Farm Stall'}
                        </Tag>
                      </div>

                      {lastMessage && (
                        <span className="shrink-0 text-xs text-stone-400">
                          {formatOrderTime(lastMessage.createdAt)}
                        </span>
                      )}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="text-xs text-stone-400">
                        {seller ? `Inquiry for ${stallName}` : 'Farm direct communication'}
                      </span>
                      {hasOrder && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600">
                          <ShoppingOutlined className="text-sage" />
                          <span>Order attached</span>
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-3">
                      <p
                        className={`truncate text-sm leading-relaxed ${
                          hasUnread
                            ? 'font-medium text-stone-800'
                            : 'text-stone-500'
                        }`}
                      >
                        {lastMessage?.body || (
                          <span className="italic text-stone-400">
                            No messages exchanged yet. Tap to start chatting.
                          </span>
                        )}
                      </p>

                      <div className="flex shrink-0 items-center gap-2">
                        {hasUnread && (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-sage px-1.5 text-[11px] font-semibold text-white">
                            {itemUnread > 99 ? '99+' : itemUnread}
                          </span>
                        )}
                        <span className="hidden text-stone-300 transition-transform group-hover:translate-x-1 group-hover:text-sage sm:inline-block">
                          <ArrowRightOutlined />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }
          )
        )}
      </main>

      {/* Safety & etiquette footer tip */}
      <footer className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-stone-400">
        <CheckCircleOutlined className="text-sage" />
        <span>All chats are direct between verified local growers and registered buyers.</span>
      </footer>
    </div>
  );
}
