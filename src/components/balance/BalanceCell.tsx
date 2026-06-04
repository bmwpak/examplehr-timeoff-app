'use client';

import React, { useEffect, useState } from 'react';
import type { Balance } from '@/types';
import { LOCATIONS } from '@/lib/constants';
import { Skeleton } from '../shared/LoadingSkeleton';
import StaleIndicator from './StaleIndicator';
import OptimisticBadge from './OptimisticBadge';
import { AlertCircle, Calendar } from 'lucide-react';
import clsx from 'clsx';

interface BalanceCellProps {
  balance: Balance | null;
  isLoading: boolean;
  isStale: boolean;
  isOptimisticPending: boolean;
  wasRolledBack: boolean;
  lastVerifiedAt: number | null;
}

export default function BalanceCell({
  balance,
  isLoading,
  isStale,
  isOptimisticPending,
  wasRolledBack,
  lastVerifiedAt,
}: BalanceCellProps) {
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (wasRolledBack) {
      const startTimer = setTimeout(() => setFlash(true), 0);
      const timer = setTimeout(() => setFlash(false), 2000);
      return () => {
        clearTimeout(startTimer);
        clearTimeout(timer);
      };
    }
  }, [wasRolledBack]);

  if (isLoading) {
    return (
      <div className="p-5 border border-zinc-200 rounded-xl bg-white space-y-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-3 w-32" />
      </div>
    );
  }

  if (!balance) return null;

  const locationName = LOCATIONS[balance.locationId] ?? balance.locationId;

  return (
    <div
      className={clsx(
        'relative p-5 border rounded-xl bg-white shadow-sm transition-all duration-300 dark:bg-zinc-900 flex flex-col justify-between h-36 min-h-36',
        isOptimisticPending && 'border-sky-300 bg-sky-50/20 dark:border-sky-900/50 dark:bg-sky-950/5',
        flash && 'border-red-500 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/10 animate-bounce',
        !isOptimisticPending && !flash && 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700'
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            {locationName}
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
              {balance.available}
            </span>
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {balance.available === 1 ? 'day' : 'days'} available
            </span>
          </div>
        </div>
        <div className="p-2 bg-zinc-50 rounded-lg dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500">
          <Calendar className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-1.5 justify-end">
        {isOptimisticPending && <OptimisticBadge />}
        {flash && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400">
            <AlertCircle className="h-3 w-3" />
            Deduction rejected (rolled back)
          </span>
        )}
        <StaleIndicator lastVerifiedAt={lastVerifiedAt} isStale={isStale} />
      </div>
    </div>
  );
}
