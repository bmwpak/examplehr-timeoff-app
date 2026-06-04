import { useQuery } from '@tanstack/react-query';
import { fetchBalance } from '@/lib/hcm-client';
import { QUERY_KEYS, BALANCE_STALE_TIME, BALANCE_GC_TIME } from '@/lib/constants';

export function useBalance(employeeId: string, locationId: string) {
  const query = useQuery({
    queryKey: QUERY_KEYS.balance(employeeId, locationId),
    queryFn: () => fetchBalance(employeeId, locationId),
    staleTime: BALANCE_STALE_TIME,
    gcTime: BALANCE_GC_TIME,
    retry: 2,
  });

  // TanStack Query's dataUpdatedAt changes on refetch, which triggers re-render.
  // We derive staleness from the query's own stale flag to avoid impure Date.now() in render.
  const isStale = query.isStale && query.dataUpdatedAt > 0;

  return {
    balance: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    isStale,
    lastVerifiedAt: query.dataUpdatedAt || null,
    refetch: query.refetch,
  };
}

