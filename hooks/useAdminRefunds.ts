'use client';

import { useMutation, useQuery } from 'convex/react';
import { App } from 'antd';
import { useState } from 'react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { AdminRefundRequest, RefundDisbursementMethod } from '@/types/admin';

interface UseAdminRefundsResult {
  refunds: AdminRefundRequest[];
  isLoading: boolean;
  error: string | null;
  approve: (orderId: string) => Promise<boolean>;
  reject: (orderId: string, reason: string) => Promise<boolean>;
  completeRefund: (orderId: string, refundReference: string, refundMethod: RefundDisbursementMethod) => Promise<boolean>;
}

export function useAdminRefunds(): UseAdminRefundsResult {
  const raw = useQuery(api.admin.listPendingRefundRequests, {});
  const { message } = App.useApp();
  const approveMutation = useMutation(api.admin.approveReturnRequest);
  const rejectMutation = useMutation(api.admin.rejectReturnRequest);
  const completeMutation = useMutation(api.admin.completeReturnRefund);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    isLoading: raw === undefined,
    error: raw instanceof Error ? raw.message : null,
    approve: (orderId) => run(() => approveMutation({ orderId: orderId as Id<'orders'> }), 'Return approved; buyer can now ship the goods.'),
    reject: (orderId, reason) => run(() => rejectMutation({ orderId: orderId as Id<'orders'>, reason }), 'Return request rejected.'),
    completeRefund: (orderId, refundReference, refundMethod) => run(() => completeMutation({ orderId: orderId as Id<'orders'>, refundReference, refundMethod }), 'Refund recorded and payout hold released.'),
  };
}
