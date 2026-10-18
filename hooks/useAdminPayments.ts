'use client';

import { useState } from 'react';
import { App } from 'antd';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export function useAdminPayments() {
  const { message } = App.useApp();
  const payments = useQuery(api.admin.listPendingGcashPayments, {});
  const reviewMutation = useMutation(api.admin.reviewGcashPayment);
  const [isReviewing, setIsReviewing] = useState(false);
  const [rejectingPaymentNote, setRejectingPaymentNote] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const review = async (paymentNote: string, decision: 'paid' | 'rejected', reason?: string) => {
    setIsReviewing(true);
    try {
      await reviewMutation({ paymentNote, decision, ...(reason ? { reason } : {}) });
      message.success(decision === 'paid' ? 'Payment approved; seller can now confirm the order.' : 'Payment rejected; buyer can resubmit proof.');
      setRejectingPaymentNote(null);
      setRejectionReason('');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Could not review payment.');
    } finally {
      setIsReviewing(false);
    }
  };

  const openReject = (paymentNote: string) => {
    setRejectingPaymentNote(paymentNote);
    setRejectionReason('');
  };

  return {
    payments,
    isLoading: payments === undefined,
    error: payments instanceof Error ? payments.message : null,
    isReviewing,
    rejectingPaymentNote,
    rejectionReason,
    setRejectionReason,
    openReject,
    closeReject: () => setRejectingPaymentNote(null),
    approve: (paymentNote: string) => review(paymentNote, 'paid'),
    reject: () => rejectingPaymentNote && review(rejectingPaymentNote, 'rejected', rejectionReason.trim()),
  };
}
