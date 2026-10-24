'use client';

import { useMutation, useQuery } from 'convex/react';
import { App } from 'antd';
import { useState } from 'react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { AdminRecordedRefund, AdminRefundRequest, RefundDisbursementMethod } from '@/types/admin';

interface UseAdminRefundsResult {
  refunds: AdminRefundRequest[];
  recordedRefunds: AdminRecordedRefund[];
  isLoading: boolean;
  isRecordedLoading: boolean;
  error: string | null;
  recordedError: string | null;
  section: 'pending' | 'recorded';
  setSection: (section: 'pending' | 'recorded') => void;
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
    refunds: raw ?? [],
    recordedRefunds: recordedRaw ?? [],
    isLoading: raw === undefined,
    isRecordedLoading: recordedRaw === undefined,
    error: raw instanceof Error ? raw.message : null,
    recordedError: recordedRaw instanceof Error ? recordedRaw.message : null,
    section,
    setSection,
    selectedOrderId,
    setSelectedOrderId,
    approve: (orderId) => run(() => approveMutation({ orderId: orderId as Id<'orders'> }), 'Return approved; buyer can now ship the goods.'),
    reject: (orderId, reason) => run(() => rejectMutation({ orderId: orderId as Id<'orders'>, reason }), 'Return request rejected.'),
    completeRefund: (orderId, refundReference, refundMethod) => run(() => completeMutation({ orderId: orderId as Id<'orders'>, refundReference, refundMethod }), 'Refund recorded and payout hold released.'),
  };
}
