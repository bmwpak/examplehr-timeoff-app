import { useQuery } from '@tanstack/react-query';
import { fetchAllBalances } from '@/lib/hcm-client';
import { QUERY_KEYS, BALANCE_STALE_TIME, BALANCE_GC_TIME } from '@/lib/constants';

export function useAllBalances(employeeId: string) {
  const query = useQuery({
    queryKey: QUERY_KEYS.allBalances(employeeId),
    queryFn: () => fetchAllBalances(employeeId),
    staleTime: BALANCE_STALE_TIME,
    gcTime: BALANCE_GC_TIME,
  });

  return {
    balances: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
