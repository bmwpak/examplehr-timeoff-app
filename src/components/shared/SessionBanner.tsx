'use client';

import React from 'react';
import { useSessionStore } from '@/store/session';
import { useOptimisticStore } from '@/store/optimistic';
import { WifiOff, AlertTriangle, Loader2 } from 'lucide-react';

export default function SessionBanner() {
  const { isHCMReachable, reconciliationRunning } = useSessionStore();
  const { conflicts } = useOptimisticStore();

  const uniqueConflictEmployees = React.useMemo(() => {
    const employeeIds = new Set(conflicts.map((c) => c.employeeId));
    return employeeIds.size;
  }, [conflicts]);

  return (
    <div className="w-full space-y-1">
      {/* Reachability Failure */}
      {!isHCMReachable && (
        <div className="flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 text-sm font-medium animate-fade-in shadow-sm">
          <WifiOff className="h-4 w-4 animate-pulse" />
          <span>HCM is unreachable — balance data may be stale</span>
        </div>
      )}

      {/* Conflict Warnings */}
      {uniqueConflictEmployees > 0 && (
        <div className="flex items-center justify-center gap-2 bg-amber-500 text-black px-4 py-2 text-sm font-semibold animate-fade-in shadow-sm">
          <AlertTriangle className="h-4 w-4" />
          <span>
            Balance conflict detected for {uniqueConflictEmployees}{' '}
            {uniqueConflictEmployees === 1 ? 'employee' : 'employees'}
          </span>
        </div>
      )}

      {/* Reconciliation in progress */}
      {reconciliationRunning && (
        <div className="flex items-center justify-center gap-2 bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400 px-4 py-1 text-xs font-medium border-b border-zinc-200 dark:border-zinc-800">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Checking for balance updates...</span>
        </div>
      )}
    </div>
  );
}
