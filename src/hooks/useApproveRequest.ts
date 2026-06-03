import { useMutation, useQueryClient } from '@tanstack/react-query';
import { approveRequest, fetchBalance } from '@/lib/hcm-client';
import { QUERY_KEYS } from '@/lib/constants';

export function useApproveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      employeeId,
      locationId,
      daysRequested,
    }: {
      requestId: string;
      employeeId: string;
      locationId: string;
      daysRequested: number;
    }) => {
      // ALWAYS verify balance before approval — no optimistic update
      const currentBalance = await fetchBalance(employeeId, locationId);
      if (currentBalance.available < daysRequested) {
        throw new Error('INSUFFICIENT_BALANCE_AT_APPROVAL');
      }
      await approveRequest(requestId);
      return { employeeId, locationId };
    },

    onSuccess: (_data, params) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.balance(params.employeeId, params.locationId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.pendingRequests('mgr-001'),
      });
      // Also invalidate overall requests lists
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.requests(params.employeeId),
      });
    },
  });
}
