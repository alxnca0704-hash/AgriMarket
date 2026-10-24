'use client';

import { Alert, Button, DatePicker, Drawer, Empty, Input, Modal, Skeleton, Table, Tabs, Tag } from 'antd';
import { memo, useEffect, useState } from 'react';
import type { ColumnsType } from 'antd/es/table';
import { useAdminPayments } from '@/hooks/useAdminPayments';
import { formatPrice, formatOrderTime } from '@/lib/format';

export function AdminPaymentsView() {
  const p = useAdminPayments();
  const records = p.data?.records ?? [];
  const selected = records.find((item) => item.paymentNote === p.selected);
  const exportCsv = () => {
    const quote = (value: string) => `"${value.replaceAll('"', '""')}"`;
    const lines = [['Submitted date','Buyer','Stalls','Order IDs','Reference','Payment note','Expected amount','Status','Reviewer','Reviewed at','Rejection reason'], ...(p.exportData?.records ?? []).map((item) => [item.submittedAt,item.buyerName,item.sellerNames.join('; '),item.orderIds.join('; '),item.paymentReference,item.paymentNote,String(item.expectedAmount),`${item.status === 'paid' ? 'Approved' : item.status === 'pending' ? 'Pending' : 'Rejected'}${item.needsRefund ? ' (Needs refund)' : ''}`,item.reviewedBy,item.reviewedAt,item.rejectionReason])];
    const blob = new Blob([lines.map((line) => line.map(quote).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'gcash-payments.csv'; anchor.click(); URL.revokeObjectURL(url);
  };
  const columns: ColumnsType<(typeof records)[number]> = [
    { title: 'Submitted', dataIndex: 'submittedAt', render: (value: string) => formatOrderTime(value) },
    { title: 'Buyer', dataIndex: 'buyerName' },
    { title: 'Stall(s)', dataIndex: 'sellerNames', render: (value: string[]) => value.join(', ') },
    { title: 'Order IDs', dataIndex: 'orderIds', render: (value: string[]) => value.map((id) => id.slice(-6).toUpperCase()).join(', ') },
    { title: 'Expected', dataIndex: 'expectedAmount', render: (value: number) => formatPrice(value) },
    { title: 'Reference', dataIndex: 'paymentReference' },
    { title: 'Payment note', dataIndex: 'paymentNote' },
    { title: 'Status', dataIndex: 'status', render: (value: string, item) => <span className="flex flex-wrap gap-1"><Tag color={value === 'paid' ? 'success' : value === 'rejected' ? 'error' : 'gold'}>{value === 'paid' ? 'Approved' : value}</Tag>{item.needsRefund && <Tag color="orange">Needs refund</Tag>}{item.duplicateApproved && <Tag color="error">Duplicate reference</Tag>}</span> },
    { title: 'Attempt', dataIndex: 'attemptNumber' },
    { title: 'Reviewed by', dataIndex: 'reviewedBy' },
    { title: 'Reviewed at', dataIndex: 'reviewedAt', render: (value: string) => value ? formatOrderTime(value) : '—' },
    { title: '', render: (_, item) => <div className="flex gap-2">{item.status === 'pending' && <><Button type="primary" onClick={(e) => { e.stopPropagation(); p.setApprovePrompt(item.paymentNote); }}>Approve</Button><Button danger onClick={(e) => { e.stopPropagation(); p.setReason(''); p.setRejecting(item.paymentNote); }}>Reject</Button></>}</div> },
  ];
  return <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 sm:py-12">
    <header><p className="text-[11px] font-medium uppercase tracking-wide text-stone-400">Payments</p><div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-3xl font-semibold text-stone-900">GCash verification</h1><Button onClick={exportCsv}>Export CSV</Button></div><p className="mt-2 text-sm text-stone-500">Search and review checkout payments. Approval releases eligible seller orders for fulfilment.</p></header>
    {p.error && <Alert type="error" showIcon title={p.error} />}
    {p.isLoading ? <div className="rounded-2xl bg-white p-4"><Skeleton active paragraph={{ rows: 2 }} /></div> : <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">{[['Pending',p.data?.pendingCount ?? 0],['Pending amount',formatPrice(p.data?.pendingAmount ?? 0)],['Approved today',formatPrice(p.data?.approvedToday ?? 0)],['Approved this week',formatPrice(p.data?.approvedThisWeek ?? 0)],['Approved this month / rejected',`${formatPrice(p.data?.approvedThisMonth ?? 0)} / ${p.data?.rejectedCount ?? 0}`]].map(([label,value])=><div key={String(label)} className="rounded-2xl bg-white p-4"><p className="text-xs text-stone-500">{label}</p><p className="mt-1 text-lg font-semibold text-stone-900">{value}</p></div>)}</section>}
    <Tabs activeKey={p.status} onChange={(key) => p.setStatus(key as typeof p.status)} items={[{key:'pending',label:<span>Pending <Tag color="gold">{p.data?.pendingCount ?? 0}</Tag></span>},{key:'approved',label:'Approved'},{key:'rejected',label:'Rejected'},{key:'all',label:'All'}]} />
    <div className="flex flex-col gap-3 sm:flex-row"><AdminPaymentSearch onSearch={p.setSearch} /><DatePicker onChange={(_,date)=>p.setFrom(date ?? '')} placeholder="From date" /><DatePicker onChange={(_,date)=>p.setTo(date ?? '')} placeholder="To date" /></div>
    {p.isLoading ? <div className="rounded-2xl bg-white p-4"><Skeleton active paragraph={{ rows: 5 }} /></div> : records.length ? <div className="overflow-x-auto rounded-2xl bg-white p-2"><Table rowKey="paymentNote" columns={columns} dataSource={records} pagination={{ current:p.page, pageSize:20, total:p.data?.total ?? 0, onChange:p.setPage }} onRow={(record)=>({onClick:()=>p.setSelected(record.paymentNote),className:'cursor-pointer'})} scroll={{x:1500}} /></div> : <div className="rounded-2xl bg-white p-8"><Empty description="No payments match these filters." /></div>}
    <Drawer title="Payment details" open={Boolean(p.selected)} onClose={()=>p.setSelected(null)} size="min(92vw, 720px)">{selected && <div className="space-y-5"><div className="rounded-xl bg-stone-50 p-4"><p><b>{selected.buyerName}</b> · {selected.paymentNote}</p><p>Reference: <span className="font-mono">{selected.paymentReference}</span></p><p>Expected total: <b>{formatPrice(selected.expectedAmount)}</b></p><p>Attempt {selected.attemptNumber} · Submitted {formatOrderTime(selected.submittedAt)}</p>{selected.needsRefund && <Alert className="mt-3" type="warning" showIcon title="Needs refund: a paid order in this checkout was cancelled." />}{selected.duplicateApproved && <Alert className="mt-3" type="error" showIcon title="This reference was approved on a different payment." />}</div><h3 className="font-semibold">Per order</h3>{selected.orders.map((order)=><div key={order.orderId} className="rounded-xl bg-stone-50 p-4"><p>{order.stallName} · #{order.orderId.slice(-6).toUpperCase()}</p><p>Items {formatPrice(order.subtotal)} + delivery {formatPrice(order.deliveryFee)} = {formatPrice(order.total)}</p><p>Order {order.status} · payout {order.payoutStatus}</p></div>)}<h3 className="font-semibold">Payment history</h3>{selected.events.map((event,index)=><div key={`${event.at}-${index}`} className="rounded-xl bg-stone-50 p-4"><p>{event.type} · {formatOrderTime(event.at)}</p><p className="font-mono text-xs">{event.referenceNumber}</p>{event.reason && <p>{event.reason}</p>}</div>)}</div>}</Drawer>
    <Modal title="Confirm GCash approval" open={Boolean(p.approvePrompt)} onCancel={()=>p.setApprovePrompt(null)} onOk={()=>p.approvePrompt && void p.approve(p.approvePrompt)} okText="I verified in GCash — approve" okButtonProps={{disabled:Boolean(records.find((item)=>item.paymentNote===p.approvePrompt)?.duplicateApproved && p.overrideReason.trim().length < 5),loading:p.approvePrompt ? p.isPending(p.approvePrompt,'paid') : false}}><p className="mb-3">Check the reference and expected amount in GCash transaction history before approving:</p>{records.find((item)=>item.paymentNote===p.approvePrompt) && <div className="mb-4 rounded-xl bg-stone-50 p-3 text-sm"><p>Reference: <span className="font-mono">{records.find((item)=>item.paymentNote===p.approvePrompt)?.paymentReference}</span></p><p>Expected amount: <strong>{formatPrice(records.find((item)=>item.paymentNote===p.approvePrompt)?.expectedAmount ?? 0)}</strong></p></div>}{records.find((item)=>item.paymentNote===p.approvePrompt)?.duplicateApproved && <div className="mt-4"><Alert type="error" showIcon title="Duplicate reference already approved. A written override reason is required." /><Input.TextArea className="mt-3" value={p.overrideReason} onChange={(event)=>p.setOverrideReason(event.target.value)} placeholder="Reason for overriding duplicate protection" /></div>}</Modal>
    <Modal title="Reject GCash payment" open={Boolean(p.rejecting)} onCancel={()=>p.setRejecting(null)} onOk={()=>p.rejecting && void p.reject(p.rejecting)} okText="Reject payment" okButtonProps={{danger:true,disabled:p.reason.trim().length<5,loading:p.rejecting ? p.isPending(p.rejecting,'rejected') : false}}><p className="mb-3 text-sm text-stone-500">The buyer will see this reason and may submit a new reference.</p><Input.TextArea rows={4} maxLength={500} value={p.reason} onChange={(event)=>p.setReason(event.target.value)} /></Modal>
  </main>;
}

const AdminPaymentSearch = memo(function AdminPaymentSearch({ onSearch }: { onSearch: (value: string) => void }) {
  const [value, setValue] = useState('');
  useEffect(() => {
    const timer = window.setTimeout(() => onSearch(value), 300);
    return () => window.clearTimeout(timer);
  }, [value, onSearch]);
  return <Input.Search className="sm:max-w-md" placeholder="Reference, payment note, buyer, stall" value={value} onChange={(event) => setValue(event.target.value)} onSearch={(nextValue) => { setValue(nextValue); onSearch(nextValue); }} allowClear />;
});
