'use client';

import { useMutation, useQuery } from 'convex/react';
import { App } from 'antd';
import { useMemo, useState } from 'react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { AdminRecordedRefund, AdminRefundRequest, RefundDisbursementMethod } from '@/types/admin';

interface UseAdminRefundsResult {
  refunds: AdminRefundRequest[];
  recordedRefunds: AdminRecordedRefund[];
  visibleRefunds: AdminRefundRequest[];
  visibleRecordedRefunds: AdminRecordedRefund[];
  isLoading: boolean;
  isRecordedLoading: boolean;
  error: string | null;
  recordedError: string | null;
  section: 'pending' | 'recorded';
  setSection: (section: 'pending' | 'recorded') => void;
  search: string;
  setSearch: (search: string) => void;
  selectedOrderId: string | null;
  setSelectedOrderId: (orderId: string | null) => void;
  approve: (orderId: string) => Promise<boolean>;
  reject: (orderId: string, reason: string) => Promise<boolean>;
  completeRefund: (orderId: string, refundReference: string, refundMethod: RefundDisbursementMethod) => Promise<boolean>;
}

export function useAdminRefunds(initialSection: 'pending' | 'recorded' = 'pending'): UseAdminRefundsResult {
  const raw = useQuery(api.admin.listPendingRefundRequests, {});
  const recordedRaw = useQuery(api.admin.listRecordedRefunds, {});
  const { message } = App.useApp();
  const approveMutation = useMutation(api.admin.approveReturnRequest);
  const rejectMutation = useMutation(api.admin.rejectReturnRequest);
  const completeMutation = useMutation(api.admin.completeReturnRefund);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [section, setSection] = useState<'pending' | 'recorded'>(initialSection);
  const [search, setSearch] = useState('');
  const refunds = useMemo(() => raw ?? [], [raw]);
  const recordedRefunds = useMemo(() => recordedRaw ?? [], [recordedRaw]);
  const needle = search.trim().toLocaleLowerCase();
  const visibleRefunds = useMemo(() => refunds.filter(refund => matchesSearch([
    refund.orderId, refund.buyerName, refund.sellerName, refund.paymentReference, refund.returnCarrier, refund.returnTrackingNumber,
  ], needle)), [refunds, needle]);
  const visibleRecordedRefunds = useMemo(() => recordedRefunds.filter(refund => matchesSearch([
    refund.orderId, refund.buyerName, refund.sellerName, refund.refundReference, refund.returnCarrier, refund.returnTrackingNumber,
  ], needle)), [recordedRefunds, needle]);
  const run = async (action: () => Promise<null>, success: string): Promise<boolean> => {
    if (isSubmitting) return false;
    setIsSubmitting(true);
    try {
      await action();
      message.success(success);
      return true;
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Could not update the return request.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };
  return {
    refunds,
    recordedRefunds,
    visibleRefunds,
    visibleRecordedRefunds,
    isLoading: raw === undefined,
    isRecordedLoading: recordedRaw === undefined,
    error: raw instanceof Error ? raw.message : null,
    recordedError: recordedRaw instanceof Error ? recordedRaw.message : null,
    section,
    setSection,
    search,
    setSearch,
    selectedOrderId,
    setSelectedOrderId,
    approve: (orderId) => run(() => approveMutation({ orderId: orderId as Id<'orders'> }), 'Return approved; buyer can now ship the goods.'),
    reject: (orderId, reason) => run(() => rejectMutation({ orderId: orderId as Id<'orders'>, reason }), 'Return request rejected.'),
    completeRefund: (orderId, refundReference, refundMethod) => run(() => completeMutation({ orderId: orderId as Id<'orders'>, refundReference, refundMethod }), 'Refund recorded and payout hold released.'),
  };
}

function matchesSearch(values: string[], needle: string) {
  return !needle || values.some(value => value.toLocaleLowerCase().includes(needle));
}
