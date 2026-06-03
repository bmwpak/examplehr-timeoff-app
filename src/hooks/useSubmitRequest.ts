import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submitRequest } from '@/lib/hcm-client';
import { QUERY_KEYS } from '@/lib/constants';
import { useOptimisticStore } from '@/store/optimistic';
import { calculateOptimisticBalance } from '@/lib/reconcile';
import type { Balance } from '@/types';
import { nanoid } from 'nanoid';

interface SubmitParams {
  employeeId: string;
  locationId: string;
  startDate: string;
  endDate: string;
  daysRequested: number;
  reason: string;
}

export function useSubmitRequest() {
  const queryClient = useQueryClient();
  const { addInFlight, removeInFlight, setRequestStatus } = useOptimisticStore();

  return useMutation({
    mutationFn: submitRequest,

    onMutate: async (params: SubmitParams) => {
      const requestId = nanoid();
      const queryKey = QUERY_KEYS.balance(params.employeeId, params.locationId);

      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value for rollback
      const previousBalance = queryClient.getQueryData<Balance>(queryKey);

      // Apply optimistic deduction
      if (previousBalance !== undefined) {
        const newAvailable = calculateOptimisticBalance(
          previousBalance.available,
          params.daysRequested
        );
        if (newAvailable !== null) {
          queryClient.setQueryData<Balance>(queryKey, {
            ...previousBalance,
            available: newAvailable,
          });
        }
      }

      // Track in-flight mutation
      addInFlight({
        requestId,
        employeeId: params.employeeId,
        locationId: params.locationId,
        optimisticDeduction: params.daysRequested,
        submittedAt: Date.now(),
      });

      setRequestStatus(requestId, 'pending-optimistic');

      return { previousBalance, requestId, queryKey };
    },

    onSuccess: (data, params, context) => {
      if (!context) return;
      removeInFlight(context.requestId);
      // Once HCM confirms, status is pending-hcm or pending (awaiting manager)
      // Since POST returns 201 with status pending, we set it to 'pending'
      setRequestStatus(context.requestId, 'pending');
      
      // Invalidate to get the authoritative balance and request list
      queryClient.invalidateQueries({ queryKey: context.queryKey });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.requests(params.employeeId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pendingRequests('mgr-001') });
    },

    onError: (_error, params, context) => {
      if (!context) return;
      // Rollback optimistic update
      if (context.previousBalance !== undefined) {
        queryClient.setQueryData(context.queryKey, context.previousBalance);
      }
      removeInFlight(context.requestId);
      setRequestStatus(context.requestId, 'rolled-back');
      
      queryClient.invalidateQueries({ queryKey: context.queryKey });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.requests(params.employeeId) });
    },
  });
}
