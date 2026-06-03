'use client';

import React from 'react';
import { SEED_EMPLOYEES } from '@/lib/constants';
import { useBalance } from '@/hooks/useBalance';
import { useOptimisticStore } from '@/store/optimistic';
import { hasInFlightMutation } from '@/lib/reconcile';
import BalanceCell from './BalanceCell';

interface BalanceGridProps {
  employeeId: string;
}

function BalanceCellWrapper({
  employeeId,
  locationId,
}: {
  employeeId: string;
  locationId: string;
}) {
  const { balance, isLoading, isStale, lastVerifiedAt } = useBalance(employeeId, locationId);
  const { inFlightRequests, requestStatuses } = useOptimisticStore();

  const isOptimisticPending = hasInFlightMutation(employeeId, locationId, inFlightRequests);

  // Check if there are any requests for this employee & location in requestStatuses that are 'rolled-back'
  const wasRolledBack = React.useMemo(() => {
    // If there are any rolled-back requests in the store, we can trigger the flash
    return Object.values(requestStatuses).some((status) => status === 'rolled-back');
  }, [requestStatuses]);

  return (
    <BalanceCell
      balance={balance}
      isLoading={isLoading}
      isStale={isStale}
      isOptimisticPending={isOptimisticPending}
      wasRolledBack={wasRolledBack}
      lastVerifiedAt={lastVerifiedAt}
    />
  );
}

export default function BalanceGrid({ employeeId }: BalanceGridProps) {
  const employee = SEED_EMPLOYEES.find((e) => e.id === employeeId);
  if (!employee) {
    return (
      <div className="p-4 border border-red-200 rounded-lg bg-red-50 text-red-700 dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-400">
        Employee not found
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {employee.locationIds.map((locationId) => (
        <BalanceCellWrapper
          key={locationId}
          employeeId={employeeId}
          locationId={locationId}
        />
      ))}
    </div>
  );
}
