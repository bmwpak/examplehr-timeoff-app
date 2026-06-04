'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';
import type { TimeOffRequest } from '@/types';
import RequestReviewCard from './RequestReviewCard';
import { Skeleton } from '../shared/LoadingSkeleton';
import {
  ClipboardList,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckSquare,
  XSquare,
} from 'lucide-react';
import { format } from 'date-fns';
import { LOCATIONS } from '@/lib/constants';
import clsx from 'clsx';

interface PendingQueueProps {
  managerId: string;
}

// ── Compact resolved card ─────────────────────────────────────────────────────
function ResolvedCard({ request }: { request: TimeOffRequest }) {
  const isApproved = request.status === 'approved';
  const locationName = LOCATIONS[request.locationId] ?? request.locationId;

  return (
    <div
      className={clsx(
        'flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl border text-sm',
        isApproved
          ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/20'
          : 'border-red-200 bg-red-50/60 dark:border-red-900/40 dark:bg-red-950/20'
      )}
    >
      {/* Left: employee + dates */}
      <div className="flex items-start gap-3 min-w-0">
        <div
          className={clsx(
            'mt-0.5 flex-shrink-0 rounded-full p-1',
            isApproved
              ? 'bg-emerald-100 dark:bg-emerald-900/40'
              : 'bg-red-100 dark:bg-red-900/40'
          )}
        >
          {isApproved ? (
            <CheckSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <XSquare className="h-4 w-4 text-red-600 dark:text-red-400" />
          )}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-zinc-800 dark:text-zinc-100 truncate">
            {request.employeeId === 'emp-001' ? 'Alice Chen' : 'Bob Patel'}
            <span className="ml-1.5 text-xs font-normal text-zinc-400">
              ({request.employeeId})
            </span>
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {format(new Date(request.startDate), 'MMM d')} –{' '}
            {format(new Date(request.endDate), 'MMM d, yyyy')} ·{' '}
            <span className="font-medium">{request.daysRequested} days</span> ·{' '}
            {locationName}
          </p>
          {request.reason && (
            <p className="text-xs italic text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
              &quot;{request.reason}&quot;
            </p>
          )}
        </div>
      </div>

      {/* Right: status badge + resolved time */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span
          className={clsx(
            'text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide',
            isApproved
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
              : 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300'
          )}
        >
          {request.status}
        </span>
        {request.resolvedAt && (
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
            {format(new Date(request.resolvedAt), 'MMM d, yyyy · h:mm a')}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function PendingQueue({ managerId }: PendingQueueProps) {
  const [resolvedOpen, setResolvedOpen] = useState(true);

  const { data: requests, isLoading, isError } = useQuery({
    queryKey: QUERY_KEYS.pendingRequests(managerId),
    queryFn: async () => {
      const res = await fetch(`/api/hcm/requests?managerId=${managerId}`);
      if (!res.ok) throw new Error('Failed to fetch pending requests');
      return res.json() as Promise<TimeOffRequest[]>;
    },
  });

  const pendingRequests = React.useMemo(
    () => (requests ?? []).filter((r) => r.status === 'pending'),
    [requests]
  );

  const resolvedRequests = React.useMemo(
    () =>
      (requests ?? [])
        .filter((r) => r.status === 'approved' || r.status === 'denied')
        .sort((a, b) => {
          const ta = a.resolvedAt ? new Date(a.resolvedAt).getTime() : 0;
          const tb = b.resolvedAt ? new Date(b.resolvedAt).getTime() : 0;
          return tb - ta; // newest first
        }),
    [requests]
  );

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
        <p className="font-semibold">Unable to load requests queue</p>
        <p className="text-xs mt-1">Please try reloading the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* ── Pending Section ─────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">
              Pending Review
            </h2>
            {pendingRequests.length > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                {pendingRequests.length}
              </span>
            )}
          </div>
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

      {/* ── Resolved Section ────────────────────────────────────────── */}
      {resolvedRequests.length > 0 && (
        <div className="space-y-3">
          {/* Collapsible header */}
          <button
            type="button"
            onClick={() => setResolvedOpen((o) => !o)}
            className="w-full flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-800 group"
          >
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-zinc-400" />
              <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">
                Resolved Requests
              </h2>
              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                {resolvedRequests.length}
              </span>
            </div>
            {resolvedOpen ? (
              <ChevronUp className="h-4 w-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 transition-colors" />
            ) : (
              <ChevronDown className="h-4 w-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 transition-colors" />
            )}
          </button>

          {resolvedOpen && (
            <div className="space-y-2">
              {resolvedRequests.map((req) => (
                <ResolvedCard key={req.id} request={req} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
