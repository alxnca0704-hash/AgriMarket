'use client';

import { useMemo } from 'react';
import { Alert, Button, DatePicker, Drawer, Empty, Input, InputNumber, Modal, Skeleton, Table, Tabs, Tag } from 'antd';
import type { TableProps } from 'antd';
import { CheckOutlined, CloseOutlined, DownloadOutlined, SearchOutlined } from '@ant-design/icons';
import { useAdminDeposits } from '@/hooks/useAdminDeposits';
import { DEPOSIT_ACTION_KEYS, STALL_DEPOSIT_AMOUNT } from '@/constants/deposits';
import { formatPrice, formatOrderTime } from '@/lib/format';
import type { DepositRecord, DepositStallRow } from '@/types/deposit';

const statusColor = (status: string) => status === 'approved' || status === 'paid' ? 'success' : status === 'pending' ? 'processing' : status === 'rejected' ? 'error' : 'warning';

export function AdminDepositsView() {
  const review = useAdminDeposits();
  const rows = review.records?.page ?? [];
  const tableColumns: TableProps<DepositRecord>['columns'] = [
    { title: 'Submitted', dataIndex: 'submittedAt', sorter: (a, b) => Date.parse(a.submittedAt ?? a.createdAt) - Date.parse(b.submittedAt ?? b.createdAt), render: (_value, item) => formatOrderTime(item.submittedAt ?? item.createdAt) },
    { title: 'Stall', dataIndex: 'stallName', sorter: (a, b) => a.stallName.localeCompare(b.stallName) },
    { title: 'Seller', dataIndex: 'sellerName' },
    { title: 'Amount', dataIndex: 'amount', render: (value: number) => formatPrice(value) },
    { title: 'Reference', dataIndex: 'referenceNumber', render: (value: string) => <span className="font-mono">{value}</span> },
    { title: 'Status', dataIndex: 'status', render: (value: string) => <Tag color={statusColor(value)}>{value}</Tag> },
    { title: 'Approved', dataIndex: 'approvedAmount', render: (value?: number) => value === undefined ? '—' : formatPrice(value) },
    { title: 'Reviewed by', dataIndex: 'reviewedBy', render: (value?: string) => value ?? '—' },
    { title: 'Reviewed at', dataIndex: 'reviewedAt', render: (value?: string) => value ? formatOrderTime(value) : '—' },
    { title: 'Attempt', dataIndex: 'attemptNumber', render: (value?: number) => value ?? '—' },
  ];
  const stallColumns: TableProps<DepositStallRow>['columns'] = [
    { title: 'Stall', dataIndex: 'stallName', sorter: (a, b) => a.stallName.localeCompare(b.stallName) },
    { title: 'Required', render: () => formatPrice(STALL_DEPOSIT_AMOUNT) },
    { title: 'Paid', dataIndex: 'paid', sorter: (a, b) => a.paid - b.paid, render: (value: number) => formatPrice(value) },
    { title: 'Remaining', dataIndex: 'remaining', sorter: (a, b) => a.remaining - b.remaining, render: (value: number) => formatPrice(value) },
    { title: 'Status', dataIndex: 'status', render: (value: string) => <Tag color={statusColor(value)}>{value}</Tag> },
    { title: 'Deadline', dataIndex: 'deadline', sorter: (a, b) => a.deadline - b.deadline, render: (value: number, item) => value ? <span>{new Date(value).toLocaleDateString('en-PH')} · {item.overdue ? <strong className="text-error">Overdue</strong> : `${Math.max(0, Math.ceil((value - Date.now()) / 86400000))} days left`}</span> : '—' },
  ];
  const exportCsv = () => {
    const header = ['Submitted date', 'Stall', 'Seller', 'Amount', 'Reference', 'Status', 'Approved amount', 'Reviewed by', 'Reviewed at', 'Attempt'];
    const values = rows.map(row => [row.submittedAt ?? row.createdAt, row.stallName, row.sellerName, row.amount, row.referenceNumber, row.status, row.approvedAmount ?? '', row.reviewedBy ?? '', row.reviewedAt ?? '', row.attemptNumber ?? '']);
    const csv = [header, ...values].map(line => line.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `stall-deposits-${review.tab}.csv`; anchor.click(); URL.revokeObjectURL(url);
  };
  const detail = review.detail;
  const timeline = useMemo(() => (detail?.attempts ?? []).flatMap(attempt => attempt.events.map(event => ({ ...event, referenceNumber: attempt.referenceNumber, attemptNumber: attempt.attemptNumber ?? 1 }))), [detail]);
  if (review.isLoading) return <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6"><Skeleton active paragraph={{ rows: 8 }} /></div>;
  if (review.error) return <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6"><Alert type="error" showIcon title="Could not load deposit records" description={review.error} /></div>;
  const summary = review.summary!;
  return <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
    <header className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-medium uppercase tracking-wide text-stone-400">Admin ledger</p><h1 className="text-3xl font-semibold text-stone-900">Stall deposits</h1><p className="mt-1 text-sm text-stone-500">Review GCash references and track each stall’s separate security deposit balance.</p></div><Button icon={<DownloadOutlined />} onClick={exportCsv}>Export current page CSV</Button></header>
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Metric title="Total deposits held" value={formatPrice(summary.approvedTotal)} hint="Sum of approved submission amounts" />
      <Metric title="Stalls by status" value={`${summary.unpaid} unpaid · ${summary.partial} partial · ${summary.paid} paid`} hint="Per-stall deposit balances" />
      <Metric title="Pending review" value={`${summary.pendingCount} · ${formatPrice(summary.pendingAmount)}`} hint="Submitted amount awaiting review" />
      <Metric title="Total still expected" value={formatPrice(summary.totalExpected)} hint="Sum of per-stall remaining balances" />
    </section>
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-3"><Metric title="Approved today" value={formatPrice(summary.approvedToday)} /><Metric title="Approved this week" value={formatPrice(summary.approvedWeek)} /><Metric title="Approved this month" value={formatPrice(summary.approvedMonth)} /></section>
    <Tabs activeKey={review.tab} onChange={key => review.setTab(key as 'pending' | 'approved' | 'rejected' | 'all')} items={[
      { key: 'pending', label: `Pending (${summary.pendingCount})` }, { key: 'approved', label: 'Approved' }, { key: 'rejected', label: 'Rejected' }, { key: 'all', label: 'All submissions' },
    ]} />
    <section className="space-y-4 rounded-2xl bg-white p-4 sm:p-6">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(180px,1fr)_minmax(240px,auto)]"><Input prefix={<SearchOutlined />} value={review.search} onChange={event => review.setSearch(event.target.value)} placeholder="Search reference or stall name" allowClear /><DatePicker.RangePicker className="w-full" onChange={value => { const range = value?.[0] && value?.[1] ? [value[0].format('YYYY-MM-DD'), value[1].format('YYYY-MM-DD')] as [string, string] : null; review.setFrom(range?.[0] ?? null); review.setTo(range?.[1] ?? null); }} /></div>
      <div className="overflow-x-auto"><Table rowKey="_id" size="small" dataSource={rows} columns={tableColumns} pagination={false} onRow={record => ({ onClick: () => review.setSelectedId(record._id), className: 'cursor-pointer' })} locale={{ emptyText: <Empty description="No deposit submissions match these filters." /> }} /></div>
      <div className="flex justify-end gap-2"><Button disabled={!review.cursor} onClick={review.previousPage}>First page</Button><Button disabled={review.records?.isDone} onClick={review.nextPage}>Next page</Button></div>
    </section>
    <section className="space-y-4 rounded-2xl bg-white p-4 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-base font-semibold text-stone-900">Per-stall balances</h2><p className="mt-1 text-sm text-stone-500">Balance totals use approved deposit submissions.</p></div><select className="rounded-lg bg-stone-50 px-3 py-2 text-sm" value={review.stallStatus} onChange={event => review.setStallStatus(event.target.value as 'all' | 'unpaid' | 'partial' | 'paid')}><option value="all">All statuses</option><option value="unpaid">Unpaid</option><option value="partial">Partial</option><option value="paid">Paid</option></select></div><div className="overflow-x-auto"><Table rowKey="stallId" size="small" dataSource={review.stalls ?? []} columns={stallColumns} pagination={{ pageSize: 20, showSizeChanger: false }} /></div></section>
    <Drawer title="Deposit submission details" open={Boolean(review.selectedId)} onClose={() => review.setSelectedId(null)} size="large">
      {!detail ? <Skeleton active /> : <div className="space-y-5">
        <div className="rounded-xl bg-stone-50 p-4"><div className="flex flex-wrap justify-between gap-2"><h2 className="font-semibold">{detail.stall?.stallName ?? 'Stall'} · attempt {detail.deposit.attemptNumber ?? 1}</h2><Tag color={statusColor(detail.deposit.status)}>{detail.deposit.status}</Tag></div><p className="mt-2 text-sm text-stone-600">Seller: {detail.seller?.fullName ?? 'Seller'}</p><p className="text-sm text-stone-600">Submitted: {formatOrderTime(detail.deposit.submittedAt ?? detail.deposit.createdAt)}</p><p className="text-sm text-stone-600">Amount: {formatPrice(detail.deposit.amount)} · Reference: <span className="font-mono">{detail.deposit.referenceNumber}</span></p><p className="mt-2 text-sm font-medium">Stall balance: {formatPrice(detail.stall?.depositPaidAmount ?? 0)} paid · {formatPrice(Math.max(0, STALL_DEPOSIT_AMOUNT - (detail.stall?.depositPaidAmount ?? 0)))} remaining of {formatPrice(STALL_DEPOSIT_AMOUNT)}</p>{detail.deposit.rejectionReason && <Alert className="mt-3" type="error" title={detail.deposit.rejectionReason} />}</div>
        {detail.duplicateApproved && detail.deposit.status === 'pending' && <Alert type="error" showIcon title="This reference was already approved on another submission." description="Approval is blocked unless you provide a written override reason." />}
        {detail.deposit.status === 'pending' && <div className="space-y-3 rounded-xl bg-stone-50 p-4"><label className="block text-sm">Amount actually received<InputNumber className="!mt-1 !w-full" min={0.01} max={Math.max(0, STALL_DEPOSIT_AMOUNT - (detail.stall?.depositPaidAmount ?? 0))} value={review.confirmedAmounts[detail.deposit._id] ?? detail.deposit.amount} onChange={value => review.setConfirmedAmount(detail.deposit._id, value ?? 0)} /></label>{(review.confirmedAmounts[detail.deposit._id] ?? detail.deposit.amount) !== detail.deposit.amount && <Alert type="warning" showIcon title={`Submitted ${formatPrice(detail.deposit.amount)}; approving ${formatPrice(review.confirmedAmounts[detail.deposit._id] ?? detail.deposit.amount)}.`} description="Both amounts are retained in the submission record." />}<Input.TextArea rows={2} maxLength={500} value={review.overrideReasons[detail.deposit._id] ?? ''} onChange={event => review.setOverrideReason(detail.deposit._id, event.target.value)} placeholder={detail.duplicateApproved ? 'Required: written duplicate reference override reason' : 'Optional approval note'} /><div className="flex flex-wrap gap-2"><Button type="primary" icon={<CheckOutlined />} loading={review.isPending(DEPOSIT_ACTION_KEYS.approve(detail.deposit._id))} disabled={detail.duplicateApproved && (review.overrideReasons[detail.deposit._id] ?? '').trim().length < 5} onClick={() => void review.approveDeposit(detail.deposit)}>Verify in GCash and approve</Button><Button danger icon={<CloseOutlined />} onClick={() => { review.setRejectingId(detail.deposit._id); review.setReason(''); }}>Reject</Button></div></div>}
        <div><h3 className="mb-3 text-sm font-semibold">Full event timeline</h3>{timeline.map((event, index) => <div key={`${event.at}-${index}`} className="mb-2 rounded-xl bg-stone-50 p-3"><p className="font-medium">{'label' in event ? event.label : event.type}</p><p className="mt-1 text-xs text-stone-500">Attempt {event.attemptNumber} · {event.referenceNumber} · {formatOrderTime(event.at)} · {'actorRole' in event ? `${event.actorRole}: ${event.actorId}` : event.actor ?? 'System'}</p>{event.amount !== undefined && <p className="mt-1 text-xs">Amount {formatPrice(event.amount)}</p>}{event.reason && <p className="mt-1 text-sm text-error">{event.reason}</p>}</div>)}</div>
      </div>}
    </Drawer>
    <Modal title="Reject deposit" open={review.rejectingId !== null} onCancel={() => review.setRejectingId(null)} onOk={() => void review.rejectDeposit()} okText="Reject" okButtonProps={{ danger: true, disabled: review.reason.trim().length < 5, loading: review.rejectingId ? review.isPending(DEPOSIT_ACTION_KEYS.reject(review.rejectingId)) : false }} width="min(92%, 480px)"><p className="mb-3 text-sm text-stone-500">A reason is required and will be sent to the seller.</p><Input.TextArea rows={4} maxLength={500} value={review.reason} onChange={event => review.setReason(event.target.value)} /></Modal>
  </div>;
}

function Metric({ title, value, hint }: { title: string; value: string; hint?: string }) {
  return <div className="rounded-2xl bg-white p-4"><p className="text-xs font-medium uppercase tracking-wide text-stone-400">{title}</p><p className="mt-2 text-xl font-semibold text-stone-900">{value}</p>{hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}</div>;
}
