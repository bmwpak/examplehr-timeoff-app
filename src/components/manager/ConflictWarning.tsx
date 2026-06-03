import React from 'react';
import { AlertOctagon } from 'lucide-react';

interface ConflictWarningProps {
  available: number;
  requested: number;
}

export default function ConflictWarning({ available, requested }: ConflictWarningProps) {
  return (
    <div className="p-4 border border-red-200 rounded-lg bg-red-50 text-red-800 dark:bg-red-955/20 dark:border-red-900/50 dark:text-red-400 flex items-start gap-2.5">
      <AlertOctagon className="h-5 w-5 mt-0.5 text-red-600 dark:text-red-400 flex-shrink-0" />
      <div>
        <h4 className="font-bold text-sm">Insufficient Balance Conflict</h4>
        <p className="text-xs mt-1 leading-relaxed">
          The employee is requesting <span className="font-bold">{requested}</span> days, but only
          has <span className="font-bold">{available}</span> available days in the HCM system. Approving
          this request is disabled as it would cause a negative balance.
        </p>
      </div>
    </div>
  );
}
