'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSubmitRequest } from '@/hooks/useSubmitRequest';
import { useSessionStore } from '@/store/session';
import { useOptimisticStore } from '@/store/optimistic';
import BalancePreview from './BalancePreview';
import {
  parseISO,
  differenceInCalendarDays,
  isBefore,
  isValid,
  addDays,
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  startOfWeek,
  endOfWeek,
  isToday,
  isSameMonth,
} from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight, Loader2, Send, Lock, Circle } from 'lucide-react';
import clsx from 'clsx';
import { LOCATIONS, QUERY_KEYS } from '@/lib/constants';
import type { TimeOffRequest } from '@/types';

interface RequestFormProps {
  employeeId: string;
  locationId: string;
  availableBalance: number | null;
  onSuccess?: () => void;
}

// Returns an ISO date string "yyyy-MM-dd" from a Date object
function toDateStr(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

// Build a Set of blocked date strings from existing approved/pending requests
function buildBlockedDates(
  requests: TimeOffRequest[],
  locationId: string
): Set<string> {
  const blocked = new Set<string>();
  for (const req of requests) {
    if (req.locationId !== locationId) continue;
    if (req.status !== 'approved' && req.status !== 'pending') continue;
    const start = parseISO(req.startDate);
    const end = parseISO(req.endDate);
    if (!isValid(start) || !isValid(end)) continue;
    const days = eachDayOfInterval({ start, end });
    for (const day of days) blocked.add(toDateStr(day));
  }
  return blocked;
}

// Check whether any date in [start, end] is blocked
function rangeHasBlockedDay(
  start: string,
  end: string,
  blocked: Set<string>
): boolean {
  if (!start || !end) return false;
  const s = parseISO(start);
  const e = parseISO(end);
  if (!isValid(s) || !isValid(e) || isBefore(e, s)) return false;
  const days = eachDayOfInterval({ start: s, end: e });
  return days.some((d) => blocked.has(toDateStr(d)));
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

  // Calendar state: which month is currently shown
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const { isHCMReachable } = useSessionStore();
  const { conflicts } = useOptimisticStore();
  const submitMutation = useSubmitRequest();

  // Fetch existing requests to know which dates are already booked
  const { data: existingRequests = [] } = useQuery<TimeOffRequest[]>({
    queryKey: QUERY_KEYS.requests(employeeId),
    queryFn: async () => {
      const res = await fetch(`/api/hcm/requests?employeeId=${employeeId}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    staleTime: 30_000,
  });

  const blockedDates = useMemo(
    () => buildBlockedDates(existingRequests, locationId),
    [existingRequests, locationId]
  );

  // Reset form when location changes
  useEffect(() => {
    setStartDate('');
    setEndDate('');
    setFormError(null);
  }, [locationId]);

  useEffect(() => {
    setFormError(null);
  }, [startDate, endDate]);

  const daysRequested = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    if (!isValid(start) || !isValid(end)) return 0;
    if (isBefore(end, start)) return 0;
    return differenceInCalendarDays(end, start) + 1;
  }, [startDate, endDate]);

  const hasConflict = useMemo(
    () => conflicts.some((c) => c.employeeId === employeeId && c.locationId === locationId),
    [conflicts, employeeId, locationId]
  );

  const hasBlockedInRange = useMemo(
    () => rangeHasBlockedDay(startDate, endDate, blockedDates),
    [startDate, endDate, blockedDates]
  );

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
    !hasConflict &&
    !hasBlockedInRange;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    setFormError(null);
    submitMutation.mutate(
      { employeeId, locationId, startDate, endDate, daysRequested, reason },
      {
        onSuccess: () => {
          setStartDate('');
          setEndDate('');
          setReason('');
          if (onSuccess) onSuccess();
        },
        onError: (err: unknown) => {
          const message = err instanceof Error ? err.message : 'Submission failed. Please try again.';
          setFormError(message);
        },
      }
    );
  };

  // ── Calendar helpers ──────────────────────────────────────────────────
  const monthStart = startOfMonth(calendarMonth);
  const monthEnd = endOfMonth(calendarMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Mon
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });
  const today = new Date();

  function handleDayClick(day: Date) {
    const dayStr = toDateStr(day);
    if (blockedDates.has(dayStr)) return; // blocked — ignore click
    if (isBefore(day, today) && !isToday(day)) return; // past — ignore

    if (!startDate || (startDate && endDate)) {
      // Start fresh selection
      setStartDate(dayStr);
      setEndDate('');
    } else {
      // We have a startDate but no endDate yet
      const s = parseISO(startDate);
      if (isBefore(day, s)) {
        // Clicked before start — reset start
        setStartDate(dayStr);
        setEndDate('');
      } else {
        setEndDate(dayStr);
      }
    }
  }

  function getDayState(day: Date): 'blocked' | 'selected-start' | 'selected-end' | 'in-range' | 'today' | 'past' | 'other-month' | 'available' {
    const dayStr = toDateStr(day);
    if (!isSameMonth(day, calendarMonth)) return 'other-month';
    if (isBefore(day, today) && !isToday(day)) return 'past';
    if (blockedDates.has(dayStr)) return 'blocked';
    if (startDate && dayStr === startDate) return 'selected-start';
    if (endDate && dayStr === endDate) return 'selected-end';
    if (startDate && endDate) {
      const s = parseISO(startDate);
      const e = parseISO(endDate);
      if (!isBefore(day, s) && !isBefore(e, day)) return 'in-range';
    }
    if (isToday(day)) return 'today';
    return 'available';
  }

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
          Click a start date then an end date. Greyed-out dates are already taken.
        </p>
      </div>

      {/* ── Inline Calendar ───────────────────────────────────────────── */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
        {/* Month Navigation */}
        <div className="flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
          <button
            type="button"
            onClick={() => setCalendarMonth((m) => addDays(startOfMonth(m), -1))}
            className="p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
          </button>
          <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
            {format(calendarMonth, 'MMMM yyyy')}
          </span>
          <button
            type="button"
            onClick={() => setCalendarMonth((m) => addDays(endOfMonth(m), 1))}
            className="p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
          </button>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
          {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
            <div key={d} className="py-1.5 text-center text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 bg-white dark:bg-zinc-900 p-1 gap-0.5">
          {calDays.map((day) => {
            const state = getDayState(day);
            const dayStr = toDateStr(day);
            const isClickable = state !== 'blocked' && state !== 'past' && state !== 'other-month';

            return (
              <button
                key={dayStr}
                type="button"
                onClick={() => isClickable && handleDayClick(day)}
                disabled={!isClickable}
                title={
                  blockedDates.has(dayStr)
                    ? 'Already booked — cannot select'
                    : undefined
                }
                className={clsx(
                  'relative h-9 w-full rounded-lg text-xs font-medium transition-all duration-150',
                  state === 'other-month' && 'text-zinc-300 dark:text-zinc-700 cursor-default',
                  state === 'past' && 'text-zinc-300 dark:text-zinc-700 cursor-not-allowed',
                  state === 'blocked' &&
                    'bg-red-50 dark:bg-red-950/30 text-red-400 dark:text-red-600 cursor-not-allowed line-through',
                  state === 'selected-start' &&
                    'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-lg font-bold ring-2 ring-zinc-500',
                  state === 'selected-end' &&
                    'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-lg font-bold ring-2 ring-zinc-500',
                  state === 'in-range' &&
                    'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-none',
                  state === 'today' &&
                    'text-zinc-800 dark:text-zinc-100 font-bold ring-1 ring-zinc-400 dark:ring-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800',
                  state === 'available' &&
                    'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer'
                )}
              >
                {day.getDate()}
                {blockedDates.has(dayStr) && isSameMonth(day, calendarMonth) && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 block w-1 h-1 rounded-full bg-red-400 dark:bg-red-600" />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-700 text-[10px] text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-red-100 dark:bg-red-950/40 border border-red-300 dark:border-red-800 inline-block" />
            Already booked
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-zinc-900 dark:bg-white inline-block" />
            Selected
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 inline-block" />
            In range
          </span>
        </div>
      </div>

      {/* Selected range summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Start Date</p>
          <div className={clsx(
            'px-3 py-2 text-sm border rounded-lg font-mono',
            startDate
              ? 'border-zinc-300 dark:border-zinc-600 text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-850'
              : 'border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-400 bg-zinc-50 dark:bg-zinc-900'
          )}>
            {startDate || '— not selected —'}
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">End Date</p>
          <div className={clsx(
            'px-3 py-2 text-sm border rounded-lg font-mono',
            endDate
              ? 'border-zinc-300 dark:border-zinc-600 text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-850'
              : 'border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-400 bg-zinc-50 dark:bg-zinc-900'
          )}>
            {endDate || '— not selected —'}
          </div>
        </div>
      </div>

      {/* Date range validation messages */}
      {startDate && endDate && daysRequested <= 0 && (
        <p className="text-xs font-semibold text-red-600 dark:text-red-400">
          Invalid date range: End date must be on or after start date.
        </p>
      )}

      {hasBlockedInRange && daysRequested > 0 && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-800 dark:bg-red-955/20 dark:border-red-900/50 dark:text-red-400">
          <Lock className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p>Your selected range includes dates already booked by an approved or pending request. Please choose different dates.</p>
        </div>
      )}

      {daysRequested > 0 && !hasBlockedInRange && (
        <div className="flex items-center justify-between text-sm bg-zinc-50 px-4 py-2.5 rounded-lg dark:bg-zinc-850">
          <span className="text-zinc-600 dark:text-zinc-400 font-medium">Duration requested:</span>
          <span className="font-bold text-zinc-900 dark:text-white">
            {daysRequested} {daysRequested === 1 ? 'calendar day' : 'calendar days'}
          </span>
        </div>
      )}

      {/* Reason */}
      <div className="space-y-1.5">
        <label htmlFor="reason" className="block text-xs font-semibold text-zinc-600 dark:text-zinc-350">
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
        <BalancePreview availableBalance={availableBalance!} daysRequested={daysRequested} />
      )}

      {/* Inline Errors */}
      {(formError || !isHCMReachable || hasConflict) && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-800 dark:bg-red-955/20 dark:border-red-900/50 dark:text-red-400">
          {!isHCMReachable && <p>HCM is unreachable. Submissions are temporarily blocked.</p>}
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
