import React from 'react';
import clsx from 'clsx';
import { HelpCircle } from 'lucide-react';

interface BalancePreviewProps {
  availableBalance: number;
  daysRequested: number;
}

export default function BalancePreview({ availableBalance, daysRequested }: BalancePreviewProps) {
  if (daysRequested <= 0) return null;

  const remaining = availableBalance - daysRequested;
  const isNegative = remaining < 0;

  return (
    <div
      className={clsx(
        'p-4 rounded-lg border text-sm font-medium transition-all duration-300 flex items-start gap-2.5',
        isNegative
          ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-400'
          : 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-400'
      )}
    >
      <HelpCircle className="h-4.5 w-4.5 mt-0.5 flex-shrink-0" />
      <div>
        <p className="font-semibold">Projected Balance</p>
        <p className="mt-0.5 text-xs opacity-90">
          After this request: <span className="font-bold">{remaining}</span>{' '}
          {remaining === 1 ? 'day' : 'days'} remaining
        </p>
        {isNegative && (
          <p className="mt-1 text-xs font-semibold text-red-700 dark:text-red-300">
            Warning: This exceeds your available balance for this location.
          </p>
        )}
      </div>
    </div>
  );
}
