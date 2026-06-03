'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';
import type { TimeOffRequest } from '@/types';
import RequestReviewCard from './RequestReviewCard';
import { Skeleton } from '../shared/LoadingSkeleton';
import { ClipboardList, CheckCircle } from 'lucide-react';

interface PendingQueueProps {
  managerId: string;
}

export default function PendingQueue({ managerId }: PendingQueueProps) {
  const { data: requests, isLoading, isError } = useQuery({
    queryKey: QUERY_KEYS.pendingRequests(managerId),
    queryFn: async () => {
      const res = await fetch(`/api/hcm/requests?managerId=${managerId}`);
      if (!res.ok) throw new Error('Failed to fetch pending requests');
      return res.json() as Promise<TimeOffRequest[]>;
    },
  });

  const pendingRequests = React.useMemo(() => {
    if (!requests) return [];
    // Only show pending requests that are awaiting manager approval
    return requests.filter((r) => r.status === 'pending');
  }, [requests]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-5 border border-red-200 rounded-xl bg-red-50 text-red-850 dark:bg-red-955/20 dark:border-red-900/50 dark:text-red-400">
        <p className="font-semibold">Unable to load pending requests queue</p>
        <p className="text-xs mt-1">Please try reloading the page to fetch manager queue again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-3 dark:border-zinc-800">
        <ClipboardList className="h-5 w-5 text-zinc-500" />
        <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">
          Pending Request Queue
        </h2>
      </div>

      {pendingRequests.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 border border-dashed border-zinc-300 rounded-xl bg-zinc-50/50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/20 dark:text-zinc-400 text-center">
          <CheckCircle className="h-8 w-8 text-emerald-500 mb-2" />
          <p className="font-semibold text-sm">All caught up!</p>
          <p className="text-xs mt-0.5 opacity-90">No pending time-off requests require your review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingRequests.map((req) => (
            <RequestReviewCard key={req.id} request={req} />
          ))}
        </div>
      )}
    </div>
  );
}
