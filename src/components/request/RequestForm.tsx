'use client';

import React, { useState, useEffect } from 'react';
import { useSubmitRequest } from '@/hooks/useSubmitRequest';
import { useSessionStore } from '@/store/session';
import { useOptimisticStore } from '@/store/optimistic';
import BalancePreview from './BalancePreview';
import { parseISO, differenceInCalendarDays, isBefore, isValid } from 'date-fns';
import { Calendar, HelpCircle, Loader2, Send } from 'lucide-react';
import clsx from 'clsx';
import { LOCATIONS } from '@/lib/constants';

interface RequestFormProps {
  employeeId: string;
  locationId: string;
  availableBalance: number | null;
  onSuccess?: () => void;
}

export default function RequestForm({
  employeeId,
  locationId,
  availableBalance,
  onSuccess,
}: RequestFormProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const { isHCMReachable } = useSessionStore();
  const { conflicts } = useOptimisticStore();
  const submitMutation = useSubmitRequest();

  // Reset form status/errors when parameters change
  useEffect(() => {
    setFormError(null);
  }, [locationId, startDate, endDate]);

  // Calculate days requested
  const daysRequested = React.useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    if (!isValid(start) || !isValid(end)) return 0;
    if (isBefore(end, start)) return 0;
    return differenceInCalendarDays(end, start) + 1;
  }, [startDate, endDate]);

  const hasConflict = React.useMemo(() => {
    return conflicts.some(
      (c) => c.employeeId === employeeId && c.locationId === locationId
    );
  }, [conflicts, employeeId, locationId]);

  const isBalanceVerified = availableBalance !== null && availableBalance !== undefined;
  const isBalanceSufficient = isBalanceVerified && availableBalance! >= daysRequested;

  const isFormValid =
    startDate &&
    endDate &&
    daysRequested > 0 &&
    reason.trim().length > 0 &&
    isBalanceVerified &&
    isBalanceSufficient &&
    isHCMReachable &&
    !hasConflict;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setFormError(null);

    submitMutation.mutate(
      {
        employeeId,
        locationId,
        startDate,
        endDate,
        daysRequested,
        reason,
      },
      {
        onSuccess: () => {
          // Clear form on success
          setStartDate('');
          setEndDate('');
          setReason('');
          if (onSuccess) onSuccess();
        },
        onError: (err: any) => {
          // Preserve form state but show error inline
          setFormError(err.message || 'Submission failed. Please try again.');
        },
      }
    );
  };

  const locationName = LOCATIONS[locationId] ?? locationId;

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 border border-zinc-200 rounded-xl bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-5"
    >
      <div>
        <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-zinc-500" />
          Request Time Off — {locationName}
        </h2>
        <p className="text-xs text-zinc-500 mt-0.5 dark:text-zinc-400">
          Apply for time off. Optimistic deduction is applied instantly to your local balance view.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label
            htmlFor="startDate"
            className="block text-xs font-semibold text-zinc-600 dark:text-zinc-350"
          >
            Start Date
          </label>
          <input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3.5 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-850 dark:text-white"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="endDate"
            className="block text-xs font-semibold text-zinc-600 dark:text-zinc-350"
          >
            End Date
          </label>
          <input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3.5 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-850 dark:text-white"
            required
          />
        </div>
      </div>

      {startDate && endDate && daysRequested <= 0 && (
        <p className="text-xs font-semibold text-red-600 dark:text-red-400">
          Invalid date range: End date must be on or after start date.
        </p>
      )}

      {daysRequested > 0 && (
        <div className="flex items-center justify-between text-sm bg-zinc-50 px-4 py-2.5 rounded-lg dark:bg-zinc-850">
          <span className="text-zinc-600 dark:text-zinc-400 font-medium">
            Duration requested:
          </span>
          <span className="font-bold text-zinc-900 dark:text-white">
            {daysRequested} {daysRequested === 1 ? 'calendar day' : 'calendar days'}
          </span>
        </div>
      )}

      <div className="space-y-1.5">
        <label
          htmlFor="reason"
          className="block text-xs font-semibold text-zinc-600 dark:text-zinc-350"
        >
          Reason for Request
        </label>
        <textarea
          id="reason"
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Family vacation, personal time..."
          className="w-full px-3.5 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-850 dark:text-white"
          required
        />
      </div>

      {/* Dynamic Remaining Balance Preview */}
      {isBalanceVerified && (
        <BalancePreview
          availableBalance={availableBalance!}
          daysRequested={daysRequested}
        />
      )}

      {/* Inline Errors */}
      {(formError || !isHCMReachable || hasConflict) && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-800 dark:bg-red-955/20 dark:border-red-900/50 dark:text-red-400">
          {!isHCMReachable && (
            <p>HCM is unreachable. Submissions are temporarily blocked.</p>
          )}
          {hasConflict && (
            <p>Reconciliation conflict active for this dimension. Actions are disabled until resolved.</p>
          )}
          {formError && <p>{formError}</p>}
        </div>
      )}

      <button
        type="submit"
        disabled={!isFormValid || submitMutation.isPending}
        className={clsx(
          'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 cursor-pointer shadow-sm',
          isFormValid && !submitMutation.isPending
            ? 'bg-zinc-900 text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:bg-white dark:text-black dark:hover:bg-zinc-100'
            : 'bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed dark:bg-zinc-800 dark:text-zinc-650 dark:border-zinc-850'
        )}
      >
        {submitMutation.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Submitting request...</span>
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            <span>Submit Request</span>
          </>
        )}
      </button>
    </form>
  );
}
