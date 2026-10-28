'use client';

import { useMutation, useQuery } from 'convex/react';
import { App } from 'antd';
import { useMemo, useState } from 'react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import type {
  AdminCodRefund,
  AdminCodRefundDetail,
  AdminRecordedRefund,
  AdminRefundRequest,
  RefundDisbursementMethod,
} from '@/types/admin';

type AdminRefundsSection = 'pending' | 'cod' | 'recorded';

interface UseAdminRefundsResult {
  refunds: AdminRefundRequest[];
  recordedRefunds: AdminRecordedRefund[];
  codRefunds: AdminCodRefund[];
  visibleRefunds: AdminRefundRequest[];
  visibleRecordedRefunds: AdminRecordedRefund[];
  visibleCodRefunds: AdminCodRefund[];
  selectedCodRefund: AdminCodRefundDetail | null;
  isCodDetailLoading: boolean;
  codDetailError: string | null;
  isLoading: boolean;
  isRecordedLoading: boolean;
  isCodLoading: boolean;
  error: string | null;
  recordedError: string | null;
  codError: string | null;
  section: AdminRefundsSection;
  setSection: (section: AdminRefundsSection) => void;
  search: string;
  setSearch: (search: string) => void;
  selectedOrderId: string | null;
  setSelectedOrderId: (orderId: string | null) => void;
  selectedCodOrderId: string | null;
  setSelectedCodOrderId: (orderId: string | null) => void;
  approve: (orderId: string) => Promise<boolean>;
  reject: (orderId: string, reason: string) => Promise<boolean>;
  completeRefund: (orderId: string, refundReference: string, refundMethod: 'gcash' | 'cash') => Promise<boolean>;
  decideCodEscalation: (orderId: string, decision: 'approve' | 'uphold', reason: string) => Promise<boolean>;
  rejectCodRepayment: (orderId: string, reason: string) => Promise<boolean>;
  resolveCodDispute: (orderId: string, decision: 'seller-owes' | 'close-seller', reason: string) => Promise<boolean>;
  recordCodRefund: (orderId: string, overrideReason?: string, duplicateOverrideReason?: string) => Promise<boolean>;
  correctRefundMethod: (orderId: string, method: RefundDisbursementMethod, reason: string) => Promise<boolean>;
}

export function useAdminRefunds(initialSection: AdminRefundsSection = 'pending'): UseAdminRefundsResult {
  const raw = useQuery(api.admin.listPendingRefundRequests, {});
  const recordedRaw = useQuery(api.admin.listRecordedRefunds, {});
  const codRaw = useQuery(api.refunds.listCodRefundReviews, {});
  const { message } = App.useApp();
  const approveMutation = useMutation(api.admin.approveReturnRequest);
  const rejectMutation = useMutation(api.admin.rejectReturnRequest);
  const completeMutation = useMutation(api.admin.completeReturnRefund);
  const decideEscalationMutation = useMutation(api.refunds.adminDecideCodEscalation);
  const rejectRepaymentMutation = useMutation(api.refunds.adminRejectCodRepayment);
  const resolveDisputeMutation = useMutation(api.refunds.adminResolveCodDispute);
  const recordCodRefundMutation = useMutation(api.refunds.recordCodRefund);
  const correctMethodMutation = useMutation(api.refunds.correctRefundMethod);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedCodOrderId, setSelectedCodOrderId] = useState<string | null>(null);
  const [section, setSection] = useState<AdminRefundsSection>(initialSection);
  const [search, setSearch] = useState('');
  const selectedCodRaw = useQuery(
    api.refunds.getAdminCodRefund,
    selectedCodOrderId ? { orderId: selectedCodOrderId as Id<'orders'> } : 'skip'
  );
  const refunds = useMemo(() => raw ?? [], [raw]);
  const recordedRefunds = useMemo(() => recordedRaw ?? [], [recordedRaw]);
  const codRefunds = useMemo(() => (Array.isArray(codRaw) ? codRaw : []) as AdminCodRefund[], [codRaw]);
  const needle = search.trim().toLocaleLowerCase();
  const visibleRefunds = useMemo(() => refunds.filter(refund => matchesSearch([
    refund.orderId, refund.buyerName, refund.sellerName, refund.paymentReference, refund.returnCarrier, refund.returnTrackingNumber,
  ], needle)), [refunds, needle]);
  const visibleRecordedRefunds = useMemo(() => recordedRefunds.filter(refund => matchesSearch([
    refund.orderId, refund.buyerName, refund.sellerName, refund.refundReference, refund.returnCarrier, refund.returnTrackingNumber,
  ], needle)), [recordedRefunds, needle]);
  const visibleCodRefunds = useMemo(() => codRefunds.filter(refund => matchesSearch([
    refund.orderId, refund.buyerName, refund.sellerName, refund.paymentReference, refund.refundGcashNumber, refund.reason,
  ], needle)), [codRefunds, needle]);
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
    codRefunds,
    visibleRefunds,
    visibleRecordedRefunds,
    visibleCodRefunds,
    selectedCodRefund: (selectedCodRaw ?? null) as AdminCodRefundDetail | null,
    isCodDetailLoading: selectedCodOrderId !== null && selectedCodRaw === undefined,
    codDetailError: selectedCodRaw instanceof Error ? selectedCodRaw.message : null,
    isLoading: raw === undefined,
    isRecordedLoading: recordedRaw === undefined,
    isCodLoading: codRaw === undefined,
    error: raw instanceof Error ? raw.message : null,
    recordedError: recordedRaw instanceof Error ? recordedRaw.message : null,
    codError: codRaw instanceof Error ? codRaw.message : null,
    section,
    setSection,
    search,
    setSearch,
    selectedOrderId,
    setSelectedOrderId,
    selectedCodOrderId,
    setSelectedCodOrderId,
    approve: (orderId) => run(() => approveMutation({ orderId: orderId as Id<'orders'> }), 'Return approved; buyer can now ship the goods.'),
    reject: (orderId, reason) => run(() => rejectMutation({ orderId: orderId as Id<'orders'>, reason }), 'Return request rejected.'),
    completeRefund: (orderId, refundReference, refundMethod) => run(() => completeMutation({ orderId: orderId as Id<'orders'>, refundReference, refundMethod }), 'Refund recorded and payout hold released.'),
    decideCodEscalation: (orderId, decision, reason) => run(
      () => decideEscalationMutation({
        orderId: orderId as Id<'orders'>,
        decision,
        reason: reason.trim() || undefined,
      }),
      decision === 'approve' ? 'Return approved; buyer can ship the goods.' : 'Seller rejection upheld and request closed.'
    ),
    rejectCodRepayment: (orderId, reason) => run(
      () => rejectRepaymentMutation({ orderId: orderId as Id<'orders'>, reason }),
      'Refund submission rejected; the seller can resubmit.'
    ),
    resolveCodDispute: (orderId, decision, reason) => run(
      () => resolveDisputeMutation({ orderId: orderId as Id<'orders'>, decision, reason }),
      decision === 'seller-owes' ? 'Decision recorded; the seller still owes the refund.' : 'Refund closed in the seller\'s favor.'
    ),
    recordCodRefund: (orderId, overrideReason, duplicateOverrideReason) => run(
      () => recordCodRefundMutation({
        orderId: orderId as Id<'orders'>,
        overrideReason: overrideReason?.trim() || undefined,
        duplicateOverrideReason: duplicateOverrideReason?.trim() || undefined,
      }),
      'Seller-paid COD refund recorded and commission updated.'
    ),
    correctRefundMethod: (orderId, method, reason) => run(
      () => correctMethodMutation({ orderId: orderId as Id<'orders'>, method, reason }),
      'Refund method corrected and audited.'
    ),
  };
}

function matchesSearch(values: string[], needle: string) {
  return !needle || values.some(value => value.toLocaleLowerCase().includes(needle));
}
