'use client';

import { useState } from 'react';
import { Alert, Button, Drawer, Empty, Image, Input, Modal, Select, Skeleton, Table, Tabs, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useAdminRefunds } from '@/hooks/useAdminRefunds';
import { AdminCodRefundsPanel } from '@/components/admin/AdminCodRefundsPanel';
import type { AdminRefundRequest, RefundDisbursementMethod } from '@/types/admin';
import { formatOrderTime, formatPrice } from '@/lib/format';

const STATUS_LABELS: Record<AdminRefundRequest['status'], string> = {
  'refund-requested': 'Return requested',
  'seller-rejected': 'Seller rejected',
  escalated: 'Escalated',
  'return-approved': 'Return approved',
  'return-in-transit': 'Return in transit',
  'return-received': 'Return received',
  'repayment-submitted': 'Refund sent',
  'buyer-confirmed': 'Buyer confirmed',
  'buyer-disputed': 'Buyer disputed',
};

export function AdminRefundsView({ initialSection = 'pending' }: { initialSection?: 'pending' | 'cod' | 'recorded' }) {
  const {
    refunds, recordedRefunds, codRefunds, visibleRefunds, visibleRecordedRefunds, visibleCodRefunds,
    isLoading, isRecordedLoading, isCodLoading, error, recordedError, codError, section, setSection,
    search, setSearch, approve, reject, completeRefund, selectedOrderId, setSelectedOrderId,
    selectedCodOrderId, setSelectedCodOrderId, selectedCodRefund, isCodDetailLoading, codDetailError,
    decideCodEscalation, rejectCodRepayment, resolveCodDispute, recordCodRefund, correctRefundMethod,
  } = useAdminRefunds(initialSection);
  const [rejectOrderId, setRejectOrderId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [refundOrderId, setRefundOrderId] = useState<string | null>(null);
  const [refundReference, setRefundReference] = useState('');
  const [refundMethod, setRefundMethod] = useState<'gcash' | 'cash'>('gcash');
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [correctOpen, setCorrectOpen] = useState(false);
  const [correctMethod, setCorrectMethod] = useState<RefundDisbursementMethod>('seller-gcash');
  const [correctReason, setCorrectReason] = useState('');
  const selected = refunds.find((item) => item.orderId === selectedOrderId);
  const selectedRecord = recordedRefunds.find((item) => item.orderId === selectedOrderId);

  const submit = async (orderId: string, action: () => Promise<boolean>, close: () => void) => {
    setBusyOrderId(orderId);
    try {
      if (await action()) close();
    } finally {
      setBusyOrderId(null);
    }
  };

  const openRefundForm = (refund: AdminRefundRequest) => {
    setRefundReference('');
    setRefundMethod(refund.buyerMobileNumber ? 'gcash' : 'cash');
    setRefundOrderId(refund.orderId);
  };

  const columns: ColumnsType<AdminRefundRequest> = [
    { title: 'Order ID', dataIndex: 'orderId', render: (id: string) => <span className="font-mono text-xs">#{id.slice(-8).toUpperCase()}</span> },
    { title: 'Buyer', dataIndex: 'buyerName' },
    { title: 'Seller', dataIndex: 'sellerName' },
    { title: 'Requested', dataIndex: 'requestedAt', render: (date: string) => formatOrderTime(date) },
    { title: 'Amount', dataIndex: 'total', align: 'right', render: (amount: number) => <span className="font-medium tabular-nums">{formatPrice(amount)}</span> },
    { title: 'Courier tracking', dataIndex: 'returnTrackingNumber', render: (tracking: string) => tracking || '—' },
    { title: 'Status', dataIndex: 'status', render: (status: AdminRefundRequest['status']) => <Tag className="m-0 border-0 bg-stone-100 text-stone-700">{STATUS_LABELS[status]}</Tag> },
  ];
  const recordedColumns: ColumnsType<(typeof recordedRefunds)[number]> = [
    { title: 'Order ID', dataIndex: 'orderId', render: (id: string) => <span className="font-mono text-xs">#{id.slice(-8).toUpperCase()}</span> },
    { title: 'Buyer', dataIndex: 'buyerName' },
    { title: 'Seller', dataIndex: 'sellerName' },
    { title: 'Refunded', dataIndex: 'refundedAt', render: (date: string) => formatOrderTime(date) },
    { title: 'Amount', dataIndex: 'refundAmount', align: 'right', render: (amount: number) => <span className="font-medium tabular-nums">{formatPrice(amount)}</span> },
    { title: 'Sent by', dataIndex: 'refundMethod', render: (method: string | null) => method?.toUpperCase() ?? 'Not recorded' },
    { title: 'Courier tracking', dataIndex: 'returnTrackingNumber', render: (tracking: string) => tracking || '—' },
  ];

  if (isLoading) return <main className="mx-auto max-w-7xl space-y-5 px-4 py-8"><Skeleton active paragraph={{ rows: 6 }} /></main>;

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 sm:py-12">
      <header className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-stone-400">Returns</p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold text-stone-900">Review return requests</h1>
          <Tag color="gold">
            {section === 'pending'
              ? `${refunds.length} pending`
              : section === 'cod'
                ? `${codRefunds.length} COD`
                : `${recordedRefunds.length} recorded`}
          </Tag>
        </div>
        <p className="text-sm text-stone-500">Select a request to review its order, payment reference, buyer evidence, and next step.</p>
      </header>

      <Tabs activeKey={section} onChange={(key) => setSection(key as 'pending' | 'cod' | 'recorded')} items={[
        { key: 'pending', label: `Pending (${refunds.length})` },
        { key: 'cod', label: `COD refunds (${codRefunds.length})` },
        { key: 'recorded', label: `Refund records (${recordedRefunds.length})` },
      ]} />
      {section !== 'cod' && <Input.Search allowClear value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Order ID, courier tracking, buyer, stall, or reference" className="sm:max-w-lg" />}
      {section === 'cod' && (
        <AdminCodRefundsPanel
          refunds={codRefunds}
          visibleRefunds={visibleCodRefunds}
          isLoading={isCodLoading}
          error={codError}
          search={search}
          setSearch={setSearch}
          selectedOrderId={selectedCodOrderId}
          setSelectedOrderId={setSelectedCodOrderId}
          selectedRefund={selectedCodRefund}
          isDetailLoading={isCodDetailLoading}
          detailError={codDetailError}
          onDecideEscalation={decideCodEscalation}
          onRejectRepayment={rejectCodRepayment}
          onResolveDispute={resolveCodDispute}
          onRecordRefund={recordCodRefund}
        />
      )}

      {section === 'cod' ? null : section === 'pending' ? <>
        {error && <Alert type="error" showIcon title={error} />}
        {visibleRefunds.length === 0 ? <div className="rounded-2xl bg-white p-8"><Empty description={refunds.length ? 'No pending refunds match this search.' : 'No return requests need review.'} /></div> : <>
          <div className="hidden overflow-x-auto rounded-2xl bg-white p-2 md:block"><Table rowKey="orderId" columns={columns} dataSource={visibleRefunds} pagination={{ pageSize: 20 }} onRow={(record) => ({ onClick: () => setSelectedOrderId(record.orderId), className: 'cursor-pointer' })} scroll={{ x: 920 }} /></div>
          <div className="space-y-2 md:hidden">{visibleRefunds.map((refund) => <button key={refund.orderId} type="button" onClick={() => setSelectedOrderId(refund.orderId)} className="w-full rounded-2xl bg-white p-4 text-left"><span className="flex items-start justify-between gap-3"><span className="font-mono text-xs font-semibold text-stone-800">#{refund.orderId.slice(-8).toUpperCase()}</span><Tag className="m-0 border-0 bg-stone-100 text-stone-700">{STATUS_LABELS[refund.status]}</Tag></span><span className="mt-3 flex items-center justify-between gap-3 text-sm"><span className="truncate text-stone-600">{refund.buyerName} · {refund.sellerName}</span><strong className="shrink-0 tabular-nums text-stone-900">{formatPrice(refund.total)}</strong></span><span className="mt-1 block text-xs text-stone-400">Requested {formatOrderTime(refund.requestedAt)} · Tracking {refund.returnTrackingNumber || 'not added'}</span></button>)}</div>
        </>}
      </> : <>
        {recordedError && <Alert type="error" showIcon title={recordedError} />}
        {isRecordedLoading ? <Skeleton active paragraph={{ rows: 5 }} /> : visibleRecordedRefunds.length === 0 ? <div className="rounded-2xl bg-white p-8"><Empty description={recordedRefunds.length ? 'No refund records match this search.' : 'No refunds have been recorded.'} /></div> : <>
          <div className="hidden overflow-x-auto rounded-2xl bg-white p-2 md:block"><Table rowKey="orderId" columns={recordedColumns} dataSource={visibleRecordedRefunds} pagination={{ pageSize: 20 }} onRow={(record) => ({ onClick: () => setSelectedOrderId(record.orderId), className: 'cursor-pointer' })} scroll={{ x: 920 }} /></div>
          <div className="space-y-2 md:hidden">{visibleRecordedRefunds.map((refund) => <button key={refund.orderId} type="button" onClick={() => setSelectedOrderId(refund.orderId)} className="w-full rounded-2xl bg-white p-4 text-left"><span className="flex items-start justify-between gap-3"><span className="font-mono text-xs font-semibold text-stone-800">#{refund.orderId.slice(-8).toUpperCase()}</span><Tag className="m-0 border-0 bg-stone-100 text-stone-700">Refunded</Tag></span><span className="mt-3 flex items-center justify-between gap-3 text-sm"><span className="truncate text-stone-600">{refund.buyerName} · {refund.sellerName}</span><strong className="shrink-0 tabular-nums text-stone-900">{formatPrice(refund.refundAmount)}</strong></span><span className="mt-1 block text-xs text-stone-400">{formatOrderTime(refund.refundedAt)} · {refund.refundMethod?.toUpperCase() ?? 'Method not recorded'} · Tracking {refund.returnTrackingNumber || 'not added'}</span></button>)}</div>
        </>}
      </>}

      <Drawer title={selectedRecord ? 'Refund record' : 'Return request record'} open={Boolean(selected || selectedRecord)} onClose={() => setSelectedOrderId(null)} size="large">
        {selectedRecord && <div className="space-y-5"><section className="rounded-2xl bg-stone-50 p-4 sm:p-5"><p className="text-xs text-stone-500">Order ID</p><p className="mt-1 break-all font-mono text-sm font-semibold text-stone-900">{selectedRecord.orderId}</p><div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2"><RecordField label="Buyer" value={selectedRecord.buyerName} /><RecordField label="Seller" value={selectedRecord.sellerName} /><RecordField label="Original payment method" value={selectedRecord.paymentMethod.toUpperCase()} /><RecordField label="Refund sent by" value={selectedRecord.refundMethod?.toUpperCase() ?? 'Not recorded'} /><RecordField label="Refund amount" value={formatPrice(selectedRecord.refundAmount)} /><RecordField label="Refunded at" value={formatOrderTime(selectedRecord.refundedAt)} /><RecordField label="Refund reference" value={selectedRecord.refundReference} mono /><RecordField label="Courier" value={selectedRecord.returnCarrier || 'Not provided'} /><RecordField label="Courier tracking number" value={selectedRecord.returnTrackingNumber || 'Not provided'} mono /></div><div className="mt-4 flex flex-wrap gap-2"><Button onClick={() => { setCorrectMethod(selectedRecord.refundMethod ?? (selectedRecord.paymentMethod === 'cod' ? 'seller-gcash' : 'gcash')); setCorrectReason(''); setCorrectOpen(true); }}>Correct refund method</Button></div></section></div>}
        {selected && <div className="space-y-5">
          <section className="rounded-2xl bg-stone-50 p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="text-xs text-stone-500">Order ID</p><p className="mt-1 break-all font-mono text-sm font-semibold text-stone-900">{selected.orderId}</p></div>
              <Tag className="m-0 border-0 bg-white text-stone-700">{STATUS_LABELS[selected.status]}</Tag>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <RecordField label="Buyer" value={selected.buyerName} />
              <RecordField label="Seller" value={selected.sellerName} />
              <RecordField label="Payment method" value={selected.paymentMethod.toUpperCase()} />
              <RecordField label="Payment reference" value={selected.paymentReference} mono />
              <RecordField label="Order total" value={formatPrice(selected.total)} />
              <RecordField label="Requested" value={formatOrderTime(selected.requestedAt)} />
            </div>
            <div className="mt-4 rounded-xl bg-white p-3 text-sm text-stone-700">Buyer phone / GCash: {selected.buyerMobileNumber ? <a className="font-semibold text-stone-900 underline underline-offset-2" href={`tel:${selected.buyerMobileNumber}`}>{selected.buyerMobileNumber}</a> : <strong className="text-amber-800">Not provided</strong>}</div>
          </section>

          <section><h3 className="mb-2 text-sm font-semibold text-stone-900">Buyer reason</h3><p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-600">{selected.reason}</p></section>

          {selected.evidenceUrls.length > 0 && <section className="space-y-2"><h3 className="text-sm font-semibold text-stone-900">Buyer evidence</h3><div className="flex flex-wrap gap-3">{selected.evidenceUrls.map((url, index) => <div key={url} className="w-full max-w-52 overflow-hidden rounded-xl bg-stone-50">{url.includes('/video/upload/') ? <video src={url} controls preload="metadata" className="aspect-video w-full object-cover">Your browser does not support video playback.</video> : <Image src={url} alt={`Refund evidence ${index + 1}`} width={208} height={160} className="!h-40 !w-full object-cover" preview />}</div>)}</div></section>}

          {selected.status === 'return-approved' && <Alert type="info" showIcon title="Waiting for buyer to ship the return" description={`Return address: ${selected.returnAddress}`} />}
          {selected.status === 'return-in-transit' && <Alert type="warning" showIcon title="Waiting for seller receipt confirmation" description={`${selected.returnCarrier} · Tracking ${selected.returnTrackingNumber}`} />}

          {selected.status === 'refund-requested' && <div className="flex flex-wrap gap-2"><Button type="primary" loading={busyOrderId === selected.orderId} onClick={() => void submit(selected.orderId, () => approve(selected.orderId), () => setSelectedOrderId(null))}>Approve return</Button><Button danger loading={busyOrderId === selected.orderId} onClick={() => { setRejectReason(''); setRejectOrderId(selected.orderId); }}>Reject with reason</Button></div>}
          {selected.status === 'return-received' && selected.paymentMethod === 'cod' && (
            <Alert type="info" showIcon title="Seller-funded COD refund" description="Review this order in the COD refunds tab. The seller must repay the buyer before the admin records the refund." />
          )}
          {selected.status === 'return-received' && selected.paymentMethod !== 'cod' && <Button type="primary" onClick={() => openRefundForm(selected)}>Record refund</Button>}
        </div>}
      </Drawer>

      <Modal open={Boolean(rejectOrderId)} title="Reject return request" width="min(92%, 440px)" onCancel={() => setRejectOrderId(null)} onOk={() => rejectOrderId && void submit(rejectOrderId, () => reject(rejectOrderId, rejectReason.trim()), () => { setRejectOrderId(null); setSelectedOrderId(null); })} okText="Reject request" okButtonProps={{ danger: true, disabled: rejectReason.trim().length < 5, loading: busyOrderId === rejectOrderId }}>
        <Input.TextArea rows={4} maxLength={500} showCount placeholder="Explain why this return is rejected (at least 5 characters)." value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} />
      </Modal>

      <Modal open={Boolean(refundOrderId)} title="Record refund" width="min(92%, 440px)" onCancel={() => setRefundOrderId(null)} onOk={() => refundOrderId && void submit(refundOrderId, () => completeRefund(refundOrderId, refundReference.trim(), refundMethod), () => { setRefundOrderId(null); setSelectedOrderId(null); })} okText="Confirm refund sent" okButtonProps={{ disabled: refundReference.trim().length < 3 || (refundMethod === 'gcash' && !refunds.find((item) => item.orderId === refundOrderId)?.buyerMobileNumber), loading: busyOrderId === refundOrderId }}>
        {(() => {
          const refund = refunds.find((item) => item.orderId === refundOrderId);
          return <div className="mb-3 space-y-3">
            <p className="text-sm text-stone-500">Refund amount: <strong className="text-stone-800">{refund ? formatPrice(refund.total) : '—'}</strong></p>
            {refund?.paymentMethod === 'cod' && <Alert type="warning" showIcon title="COD was paid in cash on delivery" description="This refund is a separate outgoing payment. Confirm the refund funds are available before recording it." />}
            <p className="rounded-xl bg-stone-50 px-3 py-2 text-sm text-stone-700">Buyer phone / GCash: {refund?.buyerMobileNumber ? <a className="font-semibold text-stone-900 underline underline-offset-2" href={`tel:${refund.buyerMobileNumber}`}>{refund.buyerMobileNumber}</a> : <strong className="text-amber-800">Not provided — contact the buyer before refunding.</strong>}</p>
            <Select<'gcash' | 'cash'> className="w-full" value={refundMethod} onChange={setRefundMethod} options={[{ value: 'gcash', label: 'GCash transfer to buyer number' }, { value: 'cash', label: 'Cash handoff to buyer' }]} />
            <p className="text-xs text-stone-400">Original payment method: {refund?.paymentMethod.toUpperCase()}</p>
            <p className="text-xs text-stone-400">Enter the GCash transaction or cash receipt reference after sending the refund.</p>
            <Input maxLength={100} placeholder="Refund transaction reference" value={refundReference} onChange={(event) => setRefundReference(event.target.value)} />
          </div>;
        })()}
      </Modal>

      <Modal
        open={correctOpen}
        title="Correct refund method"
        width="min(92%, 460px)"
        onCancel={() => setCorrectOpen(false)}
        onOk={() => selectedRecord && void submit(
          selectedRecord.orderId,
          () => correctRefundMethod(selectedRecord.orderId, correctMethod, correctReason.trim()),
          () => setCorrectOpen(false)
        )}
        okText="Save correction"
        okButtonProps={{ disabled: correctReason.trim().length < 10, loading: busyOrderId === selectedRecord?.orderId }}
        cancelText="Cancel"
      >
        <div className="space-y-3">
          <p className="text-sm text-stone-500">This changes the recorded refund method and creates an audit entry. Use it only to correct a mistaken record.</p>
          <Select<RefundDisbursementMethod>
            className="w-full"
            value={correctMethod}
            onChange={setCorrectMethod}
            options={selectedRecord?.paymentMethod === 'cod'
              ? [{ value: 'seller-gcash', label: "Seller's GCash (COD)" }]
              : [
                  { value: 'gcash', label: 'Platform GCash' },
                  { value: 'cash', label: 'Cash handoff' },
                ]}
          />
          <Input.TextArea
            rows={4}
            maxLength={500}
            showCount
            placeholder="Explain why the method is being corrected (at least 10 characters)"
            value={correctReason}
            onChange={(event) => setCorrectReason(event.target.value)}
          />
        </div>
      </Modal>
    </main>
  );
}

function RecordField({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div className="min-w-0"><p className="text-xs text-stone-400">{label}</p><p className={`mt-1 break-words text-sm font-medium text-stone-800 ${mono ? 'font-mono' : ''}`}>{value}</p></div>;
}
