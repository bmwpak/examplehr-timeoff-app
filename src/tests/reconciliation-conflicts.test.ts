import { describe, it, expect, beforeEach } from 'vitest';
import { useOptimisticStore } from '@/store/optimistic';
import { reconcile } from '@/lib/reconcile';
import type { Balance, OptimisticEntry } from '@/types';

describe('Integration: Background Reconciliation & Conflict Detection', () => {
  beforeEach(() => {
    useOptimisticStore.getState().clearAll();
  });

  it('should register a conflict in Zustand store when hcm value differs and there is an in-flight request', () => {
    const cached = {
      'emp-001': { 'LOC-NY': 7 }, // Initial 10 minus 3 in-flight
    };
    const hcm: Balance[] = [
      { employeeId: 'emp-001', locationId: 'LOC-NY', available: 5, updatedAt: new Date().toISOString() },
    ];
    const inFlight: OptimisticEntry[] = [
      {
        requestId: 'req-opt',
        employeeId: 'emp-001',
        locationId: 'LOC-NY',
        optimisticDeduction: 3,
        submittedAt: Date.now(),
      },
    ];

    const { updates, conflicts } = reconcile(cached, hcm, inFlight);
    expect(updates).toHaveLength(0);
    expect(conflicts).toHaveLength(1);

    // Register conflict in store
    const store = useOptimisticStore.getState();
    store.addConflict(conflicts[0]!);

    expect(useOptimisticStore.getState().conflicts).toHaveLength(1);
    expect(useOptimisticStore.getState().conflicts[0]?.cachedValue).toBe(7);
    expect(useOptimisticStore.getState().conflicts[0]?.hcmValue).toBe(5);
  });
});
