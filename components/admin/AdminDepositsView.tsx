'use client';

import { Alert, Button, Empty, Input, InputNumber, Modal, Skeleton, Tag } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useAdminDeposits } from '@/hooks/useAdminDeposits';
import { DEPOSIT_ACTION_KEYS } from '@/constants/deposits';
import { formatPrice, formatOrderTime } from '@/lib/format';

export function AdminDepositsView() {
  const review = useAdminDeposits();
  if (review.isLoading) return <div className="mx-auto max-w-5xl px-4 py-8"><Skeleton active paragraph={{ rows: 6 }} /></div>;
  return <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 sm:py-12"><header><p className="text-xs uppercase tracking-wide text-stone-400">Admin review</p><h1 className="text-3xl font-semibold text-stone-900">Seller deposits</h1><p className="mt-2 text-sm text-stone-500">Compare each GCash reference and amount with the account transaction history.</p></header>
    {review.error && <Alert type="error" showIcon title={review.error} />}
    {review.deposits?.length === 0 ? <div className="rounded-2xl bg-white p-8"><Empty description="No deposits are awaiting review." /></div> : <div className="space-y-4">{review.deposits?.map(item => <article key={item._id} className="space-y-4 rounded-2xl bg-white p-5 shadow-sm"><div className="flex flex-wrap justify-between gap-2"><div><h2 className="font-semibold text-stone-900">{item.stallName}</h2><p className="text-sm text-stone-500">Seller: {item.sellerName}</p></div><Tag color="gold">Pending</Tag></div><div className="grid grid-cols-1 gap-3 rounded-xl bg-stone-50 p-4 sm:grid-cols-2"><p className="text-sm">Submitted: <strong>{formatPrice(item.amount)}</strong></p><p className="text-sm">Reference: <strong className="font-mono">{item.referenceNumber}</strong></p><p className="text-sm">Approved total: {formatPrice(item.approvedTotal)}</p><p className="text-sm">Remaining: {formatPrice(item.remaining)}</p><p className="text-xs text-stone-500 sm:col-span-2">{formatOrderTime(item.createdAt)}</p></div><label className="block text-sm text-stone-600">Confirmed amount received<InputNumber min={0.01} max={item.remaining} value={review.confirmedAmounts[item._id] ?? item.amount} onChange={value => review.setConfirmedAmount(item._id, value ?? 0)} className="!mt-1 !w-full" /></label><div className="flex flex-wrap gap-2"><Button type="primary" icon={<CheckOutlined />} loading={review.isPending(DEPOSIT_ACTION_KEYS.approve(item._id))} onClick={() => void review.approveDeposit(item)}>Approve deposit</Button><Button danger icon={<CloseOutlined />} onClick={() => { review.setRejectingId(item._id); review.setReason(''); }}>Reject</Button></div></article>)}</div>}
    <Modal title="Reject deposit" open={review.rejectingId !== null} onCancel={() => review.setRejectingId(null)} onOk={() => void review.rejectDeposit()} okText="Reject" okButtonProps={{ danger: true, disabled: review.reason.trim().length < 5, loading: review.rejectingId ? review.isPending(DEPOSIT_ACTION_KEYS.reject(review.rejectingId)) : false }} width="min(92%, 480px)"><p className="mb-3 text-sm text-stone-500">Give the seller a reason so they can correct and resubmit.</p><Input.TextArea rows={4} maxLength={500} value={review.reason} onChange={event => review.setReason(event.target.value)} /></Modal>
  </div>;
}
