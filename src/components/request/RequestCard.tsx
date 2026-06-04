'use client';

import React from 'react';
import type { TimeOffRequest, RequestStatus } from '@/types';
import { LOCATIONS } from '@/lib/constants';
import { useOptimisticStore } from '@/store/optimistic';
import { format, formatDistanceToNow } from 'date-fns';
import { Calendar, FileText, MapPin, Clock, CheckCircle2, XCircle, AlertCircle, HelpCircle } from 'lucide-react';
import clsx from 'clsx';

interface RequestCardProps {
  request: TimeOffRequest;
}

export default function RequestCard({ request }: RequestCardProps) {
  const { requestStatuses } = useOptimisticStore();
  const status = (requestStatuses[request.id] ?? request.status) as RequestStatus;

  const locationName = LOCATIONS[request.locationId] ?? request.locationId;
  const submittedTime = formatDistanceToNow(new Date(request.submittedAt), { addSuffix: true });

  const getStatusBadge = () => {
    switch (status) {
      case 'pending-optimistic':
      case 'pending-hcm':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/50">
            <Clock className="h-3 w-3 animate-spin text-sky-500" />
            Syncing with HCM...
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50">
            <Clock className="h-3 w-3 text-amber-500" />
            Awaiting Manager
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            Approved
          </span>
        );
      case 'denied':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/50">
            <XCircle className="h-3 w-3 text-red-500" />
            Denied
          </span>
        );
      case 'rolled-back':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/50">
            <AlertCircle className="h-3 w-3 text-red-500" />
            Deduction Rejected
          </span>
        );
      case 'unconfirmed':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700">
            <HelpCircle className="h-3 w-3 text-zinc-500" />
            Unconfirmed
          </span>
        );
    }
  };

  return (
    <div
      className={clsx(
        'p-5 border rounded-xl bg-white shadow-sm transition-all duration-300 dark:bg-zinc-900 flex flex-col md:flex-row md:items-center justify-between gap-4',
        status === 'rolled-back' && 'opacity-65 border-red-200 bg-red-50/5 dark:border-red-950/50',
        status === 'approved' && 'border-emerald-100 dark:border-emerald-950/20',
        status === 'pending-optimistic' && 'border-sky-100 dark:border-sky-950/20',
        status === 'pending' && 'border-zinc-200 dark:border-zinc-800'
      )}
    >
      <div className="space-y-2.5 max-w-xl">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            <Calendar className="h-4 w-4 text-zinc-400" />
            <span>
              {format(new Date(request.startDate), 'MMM d, yyyy')} –{' '}
              {format(new Date(request.endDate), 'MMM d, yyyy')}
            </span>
          </div>
          <span className="text-xs text-zinc-300 dark:text-zinc-700">•</span>
          <span className="text-xs font-bold bg-zinc-100 text-zinc-800 px-2 py-0.5 rounded dark:bg-zinc-850 dark:text-zinc-200">
            {request.daysRequested} {request.daysRequested === 1 ? 'day' : 'days'}
          </span>
          <span className="text-xs text-zinc-300 dark:text-zinc-700">•</span>
          <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
            <MapPin className="h-3.5 w-3.5" />
            <span>{locationName}</span>
          </div>
        </div>

        <div className="flex items-start gap-2 text-sm text-zinc-650 dark:text-zinc-300">
          <FileText className="h-4 w-4 mt-0.5 text-zinc-400 flex-shrink-0" />
          <span className="italic">&quot;{request.reason || 'No reason provided'}&quot;</span>
        </div>

        <div className="text-xs text-zinc-450 dark:text-zinc-500">
          Submitted {submittedTime}
        </div>
      </div>

      <div className="flex items-center justify-start md:justify-end">
        {getStatusBadge()}
      </div>
    </div>
  );
}
