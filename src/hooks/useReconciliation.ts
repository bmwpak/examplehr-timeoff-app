import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { fetchAllBalances } from '@/lib/hcm-client';
import { reconcile } from '@/lib/reconcile';
import { QUERY_KEYS, RECONCILIATION_INTERVAL } from '@/lib/constants';
import { useOptimisticStore } from '@/store/optimistic';
import { useSessionStore } from '@/store/session';
import type { Balance } from '@/types';

export function useReconciliation(employeeId: string) {
  const queryClient = useQueryClient();
  const { inFlightRequests, addConflict } = useOptimisticStore();
  const { setReconciliationRunning, recordReconciliation, setHCMReachable } = useSessionStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const run = async () => {
      setReconciliationRunning(true);
      try {
        const hcmBalances = await fetchAllBalances(employeeId);
        setHCMReachable(true);

        // Build current cache snapshot
        const cachedBalances: Record<string, Record<string, number>> = {};
        const queryCache = queryClient.getQueriesData<Balance>({
          queryKey: ['balance'],
        });

        for (const [queryKey, data] of queryCache) {
          if (data && Array.isArray(queryKey) && queryKey.length >= 3) {
            const empId = queryKey[1] as string;
            const locId = queryKey[2] as string;
            if (!cachedBalances[empId]) cachedBalances[empId] = {};
            cachedBalances[empId]![locId] = data.available;
          }
        }

        const { updates, conflicts } = reconcile(
          cachedBalances,
          hcmBalances,
          inFlightRequests
        );

        // Apply silent updates
        for (const updated of updates) {
          queryClient.setQueryData<Balance>(
            QUERY_KEYS.balance(updated.employeeId, updated.locationId),
            updated
          );
        }

        // Register conflicts
        for (const conflict of conflicts) {
          addConflict(conflict);
        }

        recordReconciliation();
      } catch {
        setHCMReachable(false);
        setReconciliationRunning(false);
      }
    };

    run(); // Run immediately on mount
    intervalRef.current = setInterval(run, RECONCILIATION_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [employeeId]); // eslint-disable-line react-hooks/exhaustive-deps
}
