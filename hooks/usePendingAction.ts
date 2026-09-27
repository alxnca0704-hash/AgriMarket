'use client';

import { useCallback, useRef, useState } from 'react';
import { App } from 'antd';

export type PendingActionResult = 'success' | 'error' | 'skipped';

export interface PendingActionMessages {
  success: string;
  error: string;
}

export interface UsePendingActionResult {
  run: (
    key: string,
    action: () => Promise<unknown>,
    messages: PendingActionMessages
  ) => Promise<PendingActionResult>;
  isPending: (key: string) => boolean;
}

export function usePendingAction(): UsePendingActionResult {
  const { message } = App.useApp();

  // Synchronous ref — blocks duplicate submissions within the same tick,
  // before React has had a chance to re-render with updated state.
  const inFlight = useRef<Set<string>>(new Set());
  const [pendingKeys, setPendingKeys] = useState<ReadonlySet<string>>(() => new Set());

  const run = useCallback(
    async (
      key: string,
      action: () => Promise<unknown>,
      messages: PendingActionMessages
    ): Promise<PendingActionResult> => {
      if (inFlight.current.has(key)) return 'skipped';

      inFlight.current.add(key);
      setPendingKeys((prev) => new Set(prev).add(key));

      try {
        await action();
        message.success(messages.success);
        return 'success';
      } catch (e) {
        message.error(e instanceof Error ? e.message : messages.error);
        return 'error';
      } finally {
        inFlight.current.delete(key);
        setPendingKeys((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    },
    [message]
  );

  const isPending = useCallback((key: string) => pendingKeys.has(key), [pendingKeys]);

  return { run, isPending };
}
