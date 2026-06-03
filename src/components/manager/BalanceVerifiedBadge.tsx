import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';

interface BalanceVerifiedBadgeProps {
  verifiedAt: number | null;
}

export default function BalanceVerifiedBadge({ verifiedAt }: BalanceVerifiedBadgeProps) {
  const timeString = verifiedAt ? format(new Date(verifiedAt), 'h:mm:ss a') : 'Now';

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50">
      <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
      Balance Verified at {timeString}
    </span>
  );
}
