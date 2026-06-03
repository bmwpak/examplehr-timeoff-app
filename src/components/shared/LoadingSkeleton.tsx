import React from 'react';
import clsx from 'clsx';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={clsx('animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800', className)}
    />
  );
}

export default function LoadingSkeleton() {
  return (
    <div className="space-y-4 w-full">
      <Skeleton className="h-8 w-1/3" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-48 w-full" />
    </div>
  );
}
