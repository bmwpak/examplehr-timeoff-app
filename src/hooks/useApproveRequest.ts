import { useMutation, useQueryClient } from '@tanstack/react-query';
import { approveRequest, fetchBalance } from '@/lib/hcm-client';
import { QUERY_KEYS } from '@/lib/constants';

interface ApproveParams {
  requestId: string;
  employeeId: string;
  locationId: string;
  daysRequested: number;
  balanceDeducted?: boolean;
}

export function useApproveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      employeeId,
      locationId,
      daysRequested,
      balanceDeducted,
    }: ApproveParams) => {
      // If balance was already deducted during submission, skip the pre-check
      // to avoid a false INSUFFICIENT_BALANCE error. If not yet deducted
      // (conflict mode was active at submission time), verify now.
      if (!balanceDeducted) {
        const currentBalance = await fetchBalance(employeeId, locationId);
        if (currentBalance.available < daysRequested) {
          throw new Error('INSUFFICIENT_BALANCE_AT_APPROVAL');
        }
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
