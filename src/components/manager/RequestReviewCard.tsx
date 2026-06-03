'use client';

import React from 'react';
import type { TimeOffRequest } from '@/types';
import { useBalance } from '@/hooks/useBalance';
import { useApproveRequest } from '@/hooks/useApproveRequest';
import { useDenyRequest } from '@/hooks/useDenyRequest';
import BalanceVerifiedBadge from './BalanceVerifiedBadge';
import ConflictWarning from './ConflictWarning';
import { Skeleton } from '../shared/LoadingSkeleton';
import { format } from 'date-fns';
import { LOCATIONS } from '@/lib/constants';
import { Calendar, User, FileText, MapPin, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface RequestReviewCardProps {
  request: TimeOffRequest;
}

export default function RequestReviewCard({ request }: RequestReviewCardProps) {
  const { balance, isLoading: isBalanceLoading, lastVerifiedAt } = useBalance(
    request.employeeId,
    request.locationId
  );

  const approveMutation = useApproveRequest();
  const denyMutation = useDenyRequest();

  const locationName = LOCATIONS[request.locationId] ?? request.locationId;
  const isInsufficient = balance !== null && balance.available < request.daysRequested;

  const handleApprove = () => {
    approveMutation.mutate({
      requestId: request.id,
      employeeId: request.employeeId,
      locationId: request.locationId,
      daysRequested: request.daysRequested,
    });
  };

  const handleDeny = () => {
    denyMutation.mutate({
      requestId: request.id,
      employeeId: request.employeeId,
      locationId: request.locationId,
    });
  };

  const isPendingMutation = approveMutation.isPending || denyMutation.isPending;

  return (
    <div className="p-6 border border-zinc-200 rounded-xl bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
      {/* Employee & Request Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-150 pb-4 dark:border-zinc-850">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
            <User className="h-4.5 w-4.5 text-zinc-400" />
            <span>Employee: {request.employeeId === 'emp-001' ? 'Alice Chen' : 'Bob Patel'}</span>
            <span className="text-xs font-normal text-zinc-400">({request.employeeId})</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {format(new Date(request.startDate), 'MMM d, yyyy')} –{' '}
                {format(new Date(request.endDate), 'MMM d, yyyy')}
              </span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              <span>{locationName}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center">
          <span className="text-sm font-extrabold bg-zinc-100 text-zinc-800 px-3 py-1 rounded dark:bg-zinc-800 dark:text-zinc-250">
            {request.daysRequested} {request.daysRequested === 1 ? 'Day' : 'Days'}
          </span>
        </div>
      </div>

      {/* Reason */}
      <div className="flex items-start gap-2 bg-zinc-50 p-3 rounded-lg dark:bg-zinc-850/50 text-sm text-zinc-700 dark:text-zinc-300">
        <FileText className="h-4.5 w-4.5 text-zinc-400 mt-0.5 flex-shrink-0" />
        <span className="italic">"{request.reason || 'No reason provided'}"</span>
      </div>

      {/* Balance Verification Section */}
      <div className="space-y-3 pt-1">
        {isBalanceLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                HCM Server Available Days: <span className="font-extrabold text-zinc-800 dark:text-zinc-250 text-sm">{balance?.available ?? 0}</span>
              </div>
              <BalanceVerifiedBadge verifiedAt={lastVerifiedAt} />
            </div>

            {/* Conflict Warnings */}
            {isInsufficient && balance !== null && (
              <ConflictWarning
                available={balance.available}
                requested={request.daysRequested}
              />
            )}

            {/* Mutation Errors */}
            {(approveMutation.isError || denyMutation.isError) && (
              <div className="p-3 bg-red-50 border border-red-200 text-xs font-medium text-red-800 rounded-lg dark:bg-red-955/20 dark:border-red-900/50 dark:text-red-400 flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>
                  {approveMutation.error?.message ||
                    denyMutation.error?.message ||
                    'An error occurred. Action failed.'}
                </span>
              </div>
            )}

            {/* Actions: Approve/Deny buttons (rendered only AFTER balance verified) */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleApprove}
                disabled={isInsufficient || isPendingMutation}
                className={clsx(
                  'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 cursor-pointer shadow-sm',
                  !isInsufficient && !isPendingMutation
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500'
                    : 'bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed dark:bg-zinc-800 dark:text-zinc-650 dark:border-zinc-850'
                )}
              >
                {approveMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Approving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Approve Request</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDeny}
                disabled={isPendingMutation}
                className={clsx(
                  'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 cursor-pointer border shadow-sm',
                  !isPendingMutation
                    ? 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-750'
                    : 'bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed dark:bg-zinc-800 dark:text-zinc-650 dark:border-zinc-850'
                )}
              >
                {denyMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Denying...</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4" />
                    <span>Deny Request</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
