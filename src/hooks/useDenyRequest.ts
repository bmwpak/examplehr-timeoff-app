import { useMutation, useQueryClient } from '@tanstack/react-query';
import { denyRequest } from '@/lib/hcm-client';
import { QUERY_KEYS } from '@/lib/constants';

export function useDenyRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      employeeId,
      locationId,
    }: {
      requestId: string;
      employeeId: string;
      locationId: string;
    }) => {
      await denyRequest(requestId);
      return { employeeId, locationId };
    },

    onSuccess: (_data, params) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.balance(params.employeeId, params.locationId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.pendingRequests('mgr-001'),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.requests(params.employeeId),
      });
    },
  });
}
