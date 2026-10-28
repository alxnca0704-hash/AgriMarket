'use client';

import { useCallback, useState } from 'react';
import { App } from 'antd';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Order } from '@/types/order';
import type { SellerCodRefund } from '@/types/refund';
import { ORDER_ACTION_KEYS, OrderAction } from '@/constants/orders';
import { usePendingAction } from '@/hooks/usePendingAction';
import { toOrder } from '@/lib/convexSync';

function isValidOrderId(value: string): boolean {
  return /^[a-z0-9]{32}$/.test(value);
}

export function useSellerOrderDetail(orderId: string) {
  const { message } = App.useApp();
  const skip = !isValidOrderId(orderId);
  const raw = useQuery(
    api.orders.getSellerOrder,
    skip ? 'skip' : { orderId: orderId as Id<'orders'> }
  );
  const rawCodRefund = useQuery(
    api.refunds.getSellerCodRefund,
    skip ? 'skip' : { orderId: orderId as Id<'orders'> }
  );
  const confirmMutation = useMutation(api.orders.confirmOrder);
  const rejectMutation = useMutation(api.orders.rejectOrder);
  const dispatchMutation = useMutation(api.orders.dispatchOrder);
  const completeMutation = useMutation(api.orders.completeOrder);
  const confirmReturnReceivedMutation = useMutation(api.orders.confirmReturnReceived);
  const approveCodReturnMutation = useMutation(api.refunds.approveCodReturn);
  const rejectCodReturnMutation = useMutation(api.refunds.rejectCodReturn);
  const reportCodReturnIssueMutation = useMutation(api.refunds.reportCodReturnIssue);
  const submitCodRepaymentMutation = useMutation(api.refunds.submitCodRepayment);
  const reportCodNumberIssueMutation = useMutation(api.refunds.reportCodNumberIssue);
  const revealCodRefundNumberMutation = useMutation(api.refunds.revealCodRefundNumber);
  const { run, isPending } = usePendingAction();
  const [revealedNumber, setRevealedNumber] = useState<string | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);

  const isLoading = !skip && raw === undefined;
  const order: Order | undefined = !skip && raw ? toOrder(raw) : undefined;
  const error = raw instanceof Error ? raw.message : null;
  const codRefund = (rawCodRefund ?? null) as SellerCodRefund | null;
  const codRefundError = rawCodRefund instanceof Error ? rawCodRefund.message : null;
  const notFound = skip || (!isLoading && !order);

  const handleConfirm = () => {
    if (!order) return Promise.resolve('skipped' as const);
    return run(
      ORDER_ACTION_KEYS.confirmOrder(order.id),
      () => confirmMutation({ orderId: order.id as Id<'orders'> }),
      { success: 'Order confirmed', error: 'Could not confirm the order' }
    );
  };

  const handleReject = (reason: string) => {
    if (!order) return Promise.resolve('skipped' as const);
    return run(
      ORDER_ACTION_KEYS.rejectOrder(order.id),
      () => rejectMutation({ orderId: order.id as Id<'orders'>, reason }),
      { success: 'Order rejected', error: 'Could not reject the order' }
    );
  };

  const handleDispatch = (courier: string, trackingNumber: string) => {
    if (!order) return Promise.resolve('skipped' as const);
    return run(
      ORDER_ACTION_KEYS.dispatchOrder(order.id),
      () => dispatchMutation({ orderId: order.id as Id<'orders'>, courier, trackingNumber }),
      { success: 'Order marked as to receive', error: 'Could not update the order' }
    );
  };

  const handleComplete = () => {
    if (!order) return Promise.resolve('skipped' as const);
    return run(
      ORDER_ACTION_KEYS.completeOrder(order.id),
      () => completeMutation({ orderId: order.id as Id<'orders'> }),
      { success: 'Order completed', error: 'Could not complete the order' }
    );
  };

  const handleConfirmReturnReceived = () => {
    if (!order) return Promise.resolve('skipped' as const);
    return run(
      ORDER_ACTION_KEYS.confirmReturnReceived(order.id),
      () => confirmReturnReceivedMutation({ orderId: order.id as Id<'orders'> }),
      { success: 'Return receipt confirmed', error: 'Could not confirm returned goods' }
    );
  };

  const handleApproveCodReturn = (returnAddress: string) => {
    if (!order) return Promise.resolve('skipped' as const);
    return run(
      ORDER_ACTION_KEYS.approveCodReturn(order.id),
      () => approveCodReturnMutation({ orderId: order.id as Id<'orders'>, returnAddress: returnAddress.trim() || undefined }),
      { success: 'Return approved; the buyer can now ship the goods', error: 'Could not approve the return' }
    );
  };

  const handleRejectCodReturn = (reason: string) => {
    if (!order) return Promise.resolve('skipped' as const);
    return run(
      ORDER_ACTION_KEYS.rejectCodReturn(order.id),
      () => rejectCodReturnMutation({ orderId: order.id as Id<'orders'>, reason }),
      { success: 'Return request rejected', error: 'Could not reject the return' }
    );
  };

  const handleReportCodReturnIssue = (reason: string) => {
    if (!order) return Promise.resolve('skipped' as const);
    return run(
      ORDER_ACTION_KEYS.reportCodReturnIssue(order.id),
      () => reportCodReturnIssueMutation({ orderId: order.id as Id<'orders'>, reason }),
      { success: 'Issue reported to the admin', error: 'Could not report the issue' }
    );
  };

  const handleSubmitCodRepayment = (reference: string, proofUrl: string) => {
    if (!order) return Promise.resolve('skipped' as const);
    return run(
      ORDER_ACTION_KEYS.submitCodRepayment(order.id),
      () => submitCodRepaymentMutation({ orderId: order.id as Id<'orders'>, reference, proofUrl }),
      { success: 'Refund reference and proof submitted', error: 'Could not submit the refund' }
    );
  };

  const handleReportCodNumberIssue = (reason: string) => {
    if (!order) return Promise.resolve('skipped' as const);
    return run(
      ORDER_ACTION_KEYS.reportCodNumberIssue(order.id),
      () => reportCodNumberIssueMutation({ orderId: order.id as Id<'orders'>, reason }),
      { success: 'The buyer has been asked to update the number', error: 'Could not report the number issue' }
    );
  };

  const handleRevealCodRefundNumber = async (): Promise<string | null> => {
    if (!order) return null;
    setIsRevealing(true);
    try {
      const number = await revealCodRefundNumberMutation({ orderId: order.id as Id<'orders'> });
      setRevealedNumber(number);
      return number;
    } catch (revealError) {
      message.error(revealError instanceof Error ? revealError.message : 'Could not reveal the refund number.');
      return null;
    } finally {
      setIsRevealing(false);
    }
  };

  const isActionPending = useCallback(
    (action: OrderAction, id: string) => isPending(ORDER_ACTION_KEYS[action](id)),
    [isPending]
  );

  return {
    isLoading,
    error,
    notFound,
    order,
    handleConfirm,
    handleReject,
    handleDispatch,
    handleComplete,
    handleConfirmReturnReceived,
    handleApproveCodReturn,
    handleRejectCodReturn,
    handleReportCodReturnIssue,
    handleSubmitCodRepayment,
    handleReportCodNumberIssue,
    handleRevealCodRefundNumber,
    codRefund,
    codRefundError,
    revealedNumber,
    isRevealing,
    isActionPending,
  };
}
