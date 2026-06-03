import { useQuery } from '@tanstack/react-query';
import { fetchBalance } from '@/lib/hcm-client';
import { QUERY_KEYS, BALANCE_STALE_TIME, BALANCE_GC_TIME, STALE_THRESHOLD_MS } from '@/lib/constants';

export function useBalance(employeeId: string, locationId: string) {
  const query = useQuery({
    queryKey: QUERY_KEYS.balance(employeeId, locationId),
    queryFn: () => fetchBalance(employeeId, locationId),
    staleTime: BALANCE_STALE_TIME,
    gcTime: BALANCE_GC_TIME,
    retry: 2,
  });

  const isStale = query.dataUpdatedAt > 0
    && Date.now() - query.dataUpdatedAt > STALE_THRESHOLD_MS;

  return {
    balance: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    isStale,
    lastVerifiedAt: query.dataUpdatedAt || null,
    refetch: query.refetch,
  };
}
