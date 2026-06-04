'use client';

import React from 'react';
import Link from 'next/link';
import PendingQueue from '@/components/manager/PendingQueue';
import SessionBanner from '@/components/shared/SessionBanner';
import OfflineIndicator from '@/components/shared/OfflineIndicator';
import { Home, ClipboardList, Info } from 'lucide-react';

export default function ManagerDashboard() {
  const managerId = 'mgr-001';

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6">
      {/* Status Indicators */}
      <SessionBanner />
      <OfflineIndicator />

      {/* Header and Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 pb-5 dark:border-zinc-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            <Link href="/" className="hover:text-zinc-800 dark:hover:text-white flex items-center gap-1">
              <Home className="h-3 w-3" /> Home
            </Link>
            <span>/</span>
            <span className="text-zinc-800 dark:text-white flex items-center gap-1">
              <ClipboardList className="h-3 w-3" /> Manager Dashboard
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
            Carol Wu <span className="text-zinc-500 font-medium">— Time Off Manager</span>
          </h1>
        </div>
      </div>

      {/* Manager Explanation Info Banner */}
      <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50 text-xs text-zinc-600 dark:border-zinc-850 dark:bg-zinc-900/30 dark:text-zinc-400 flex items-start gap-2.5 leading-relaxed">
        <Info className="h-4.5 w-4.5 text-zinc-500 mt-0.5 flex-shrink-0" />
        <div>
          <span className="font-bold text-zinc-800 dark:text-zinc-200">Manager Pessimistic Guard:</span> Before allowing approval, the system fetches the employee&apos;s live balance from the server to ensure they have enough days. If the balance is insufficient, approval is blocked, and an alert is shown.
        </div>
      </div>

      {/* Pending Queue Section */}
      <div className="space-y-6">
        <PendingQueue managerId={managerId} />
      </div>
    </div>
  );
}
