import { Suspense } from 'react';
import { Skeleton } from 'antd';
import { MessagesView } from '@/components/messages/MessagesView';

export default function SellerMessagesPage() {
  return <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-8 sm:px-6"><Skeleton active paragraph={{ rows: 7 }} /></div>}><MessagesView seller /></Suspense>;
}
