'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useBalance } from '@/hooks/useBalance';
import { useReconciliation } from '@/hooks/useReconciliation';
import BalanceGrid from '@/components/balance/BalanceGrid';
import RequestForm from '@/components/request/RequestForm';
import RequestHistory from '@/components/request/RequestHistory';
import SessionBanner from '@/components/shared/SessionBanner';
import OfflineIndicator from '@/components/shared/OfflineIndicator';
import { Home, User, Info, HelpCircle } from 'lucide-react';


export default function EmployeeDashboard() {
  const employeeId = 'emp-001';
  const [activeLocationId, setActiveLocationId] = useState('LOC-NY');

  // Start background reconciliation
  useReconciliation(employeeId);

  // Fetch balance for the form's active location
  const { balance: activeBalance } = useBalance(employeeId, activeLocationId);

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setActiveLocationId(e.target.value);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-6">
      {/* Session / Status banners */}
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
              <User className="h-3 w-3" /> Employee Dashboard
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
            Alice Chen <span className="text-zinc-500 font-medium">— Time Off</span>
          </h1>
        </div>

        {/* Selected Dimension Indicator */}
        <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 px-4 py-2 rounded-xl dark:bg-zinc-900 dark:border-zinc-800">
          <label
            htmlFor="activeLocation"
            className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider"
          >
            Active Dimension:
          </label>
          <select
            id="activeLocation"
            value={activeLocationId}
            onChange={handleLocationChange}
            className="text-sm font-bold bg-transparent text-zinc-800 border-none outline-none dark:text-white focus:ring-0 cursor-pointer"
          >
            <option value="LOC-NY">New York (LOC-NY)</option>
            <option value="LOC-SF">San Francisco (LOC-SF)</option>
          </select>
        </div>
      </div>

      {/* Quick Instruction Banner */}
      <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50 text-xs text-zinc-600 dark:border-zinc-850 dark:bg-zinc-900/30 dark:text-zinc-400 flex items-start gap-2.5 leading-relaxed">
        <Info className="h-4.5 w-4.5 text-zinc-500 mt-0.5 flex-shrink-0" />
        <div>
          <span className="font-bold text-zinc-800 dark:text-zinc-200">How this works:</span> Clicking the &quot;Submit Request&quot; button deducts the balance instantly from the UI view (optimistic update). The system sends the request to the HCM API. If the API succeeds, the balance remains deducted. If it fails, the local balance is rolled back. Background synchronization checks for updates every 30 seconds.
        </div>
      </div>

      {/* Main Grid content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left / Middle: Balance cells & History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-550">
              Location Balances
            </h2>
            <BalanceGrid employeeId={employeeId} />
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 italic">
              * Note: You can select the active location in the dropdown above to update the request form.
            </p>
          </div>

          <RequestHistory employeeId={employeeId} />
        </div>

        {/* Right side: Request Form */}
        <div className="space-y-6">
          <RequestForm
            employeeId={employeeId}
            locationId={activeLocationId}
            availableBalance={activeBalance ? activeBalance.available : null}
          />

          {/* Quick FAQ info panel */}
          <div className="p-5 border border-zinc-200 rounded-xl bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-3">
            <h3 className="text-xs font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle className="h-4 w-4" />
              Frequently Asked Questions
            </h3>
            <div className="space-y-3.5 text-xs text-zinc-600 dark:text-zinc-400">
              <div className="space-y-1">
                <h4 className="font-bold text-zinc-800 dark:text-zinc-200">What is a silent failure?</h4>
                <p className="leading-relaxed">
                  If the server takes too long to respond (10+ seconds) or sends empty data, the system flags a silent failure, rolls back the optimistic balance, and logs the request as rolled back.
                </p>
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-zinc-800 dark:text-zinc-200">What is a conflict?</h4>
                <p className="leading-relaxed">
                  If the server&apos;s balance changes externally (e.g. anniversary bonus) while you have an in-flight request, a conflict is detected. The system blocks further requests for that location until resolved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
