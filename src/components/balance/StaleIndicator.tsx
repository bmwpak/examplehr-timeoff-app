'use client';

import React, { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { RefreshCw } from 'lucide-react';

interface StaleIndicatorProps {
  lastVerifiedAt: number | null;
  isStale: boolean;
}

export default function StaleIndicator({ lastVerifiedAt, isStale }: StaleIndicatorProps) {
  const [, setTick] = useState(0);

  // Force re-render periodically to keep timeDistance updated
  useEffect(() => {
    if (!lastVerifiedAt) return;
    const interval = setInterval(() => setTick((t) => t + 1), 10_000);
    return () => clearInterval(interval);
  }, [lastVerifiedAt]);

  if (!lastVerifiedAt) return null;

  const timeDistance = formatDistanceToNow(new Date(lastVerifiedAt), { addSuffix: true });

  return (
    <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
      <RefreshCw className={`h-3 w-3 ${isStale ? 'text-amber-500 animate-pulse' : 'text-emerald-500'}`} />
      <span>{isStale ? `Stale (last updated ${timeDistance})` : `Updated ${timeDistance}`}</span>
    </div>
  );
}
