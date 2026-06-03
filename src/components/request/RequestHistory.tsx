'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';
import type { TimeOffRequest } from '@/types';
import RequestCard from './RequestCard';
import { Skeleton } from '../shared/LoadingSkeleton';
import { History, Inbox } from 'lucide-react';

interface RequestHistoryProps {
  employeeId: string;
}

export default function RequestHistory({ employeeId }: RequestHistoryProps) {
  const { data: requests, isLoading, isError } = useQuery({
    queryKey: QUERY_KEYS.requests(employeeId),
    queryFn: async () => {
      const res = await fetch(`/api/hcm/requests?employeeId=${employeeId}`);
      if (!res.ok) throw new Error('Failed to fetch time-off requests');
      return res.json() as Promise<TimeOffRequest[]>;
    },
  });

  const sortedRequests = React.useMemo(() => {
    if (!requests) return [];
    return [...requests].sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  }, [requests]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-5 border border-red-200 rounded-xl bg-red-50 text-red-800 dark:bg-red-955/20 dark:border-red-900/50 dark:text-red-400">
        <p className="font-semibold">Unable to load request history</p>
        <p className="text-xs mt-1">Please try reloading the page to fetch history again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-3 dark:border-zinc-800">
        <History className="h-5 w-5 text-zinc-500" />
        <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">
          Request History
        </h2>
      </div>

      {sortedRequests.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 border border-dashed border-zinc-300 rounded-xl bg-zinc-50/50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/20 dark:text-zinc-400 text-center">
          <Inbox className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mb-2" />
          <p className="font-semibold text-sm">No time-off requests found</p>
          <p className="text-xs mt-0.5 opacity-90">Use the form above to submit your first request.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedRequests.map((req) => (
            <RequestCard key={req.id} request={req} />
          ))}
        </div>
      )}
    </div>
  );
}
