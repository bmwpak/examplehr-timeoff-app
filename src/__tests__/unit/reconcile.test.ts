import { describe, it, expect } from 'vitest';
import { reconcile, calculateOptimisticBalance, hasInFlightMutation, calculateWorkingDays } from '@/lib/reconcile';
import type { Balance, OptimisticEntry } from '@/types';

const makeBalance = (employeeId: string, locationId: string, available: number): Balance => ({
  employeeId,
  locationId,
  available,
  updatedAt: new Date().toISOString(),
});

const makeInFlight = (employeeId: string, locationId: string): OptimisticEntry => ({
  requestId: 'req-1',
  employeeId,
  locationId,
  optimisticDeduction: 3,
  submittedAt: Date.now(),
});

describe('reconcile', () => {
  it('returns empty result when cache matches HCM', () => {
    const cache = { 'emp-001': { 'LOC-NY': 10 } };
    const hcm = [makeBalance('emp-001', 'LOC-NY', 10)];
    const result = reconcile(cache, hcm, []);
    expect(result.updates).toHaveLength(0);
    expect(result.conflicts).toHaveLength(0);
  });

  it('returns update when HCM differs and no in-flight', () => {
    const cache = { 'emp-001': { 'LOC-NY': 10 } };
    const hcm = [makeBalance('emp-001', 'LOC-NY', 12)];
    const result = reconcile(cache, hcm, []);
    expect(result.updates).toHaveLength(1);
    expect(result.updates[0]!.available).toBe(12);
    expect(result.conflicts).toHaveLength(0);
  });

  it('returns conflict when HCM differs and in-flight exists', () => {
    const cache = { 'emp-001': { 'LOC-NY': 7 } };
    const hcm = [makeBalance('emp-001', 'LOC-NY', 12)];
    const inFlight = [makeInFlight('emp-001', 'LOC-NY')];
    const result = reconcile(cache, hcm, inFlight);
    expect(result.conflicts).toHaveLength(1);
    expect(result.updates).toHaveLength(0);
  });

  it('handles multiple cells with mixed scenarios', () => {
    const cache = {
      'emp-001': { 'LOC-NY': 10, 'LOC-SF': 5 },
    };
    const hcm = [
      makeBalance('emp-001', 'LOC-NY', 12), // changed, no in-flight → update
      makeBalance('emp-001', 'LOC-SF', 3),  // changed, in-flight → conflict
    ];
    const inFlight = [makeInFlight('emp-001', 'LOC-SF')];
    const result = reconcile(cache, hcm, inFlight);
    expect(result.updates).toHaveLength(1);
    expect(result.updates[0]!.locationId).toBe('LOC-NY');
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0]!.locationId).toBe('LOC-SF');
  });

  it('skips cells not in cache', () => {
    const cache = {};
    const hcm = [makeBalance('emp-001', 'LOC-NY', 10)];
    const result = reconcile(cache, hcm, []);
    expect(result.updates).toHaveLength(0);
  });
});

describe('calculateOptimisticBalance', () => {
  it('returns reduced balance', () => {
    expect(calculateOptimisticBalance(10, 3)).toBe(7);
  });
  it('returns 0 for exact deduction', () => {
    expect(calculateOptimisticBalance(5, 5)).toBe(0);
  });
  it('returns null when deduction exceeds balance', () => {
    expect(calculateOptimisticBalance(3, 5)).toBeNull();
  });
  it('returns null for negative input', () => {
    expect(calculateOptimisticBalance(0, 1)).toBeNull();
  });
});

describe('hasInFlightMutation', () => {
  it('returns true when matching entry exists', () => {
    const inFlight = [makeInFlight('emp-001', 'LOC-NY')];
    expect(hasInFlightMutation('emp-001', 'LOC-NY', inFlight)).toBe(true);
  });
  it('returns false when no match', () => {
    const inFlight = [makeInFlight('emp-001', 'LOC-NY')];
    expect(hasInFlightMutation('emp-001', 'LOC-SF', inFlight)).toBe(false);
  });
  it('returns false for empty array', () => {
    expect(hasInFlightMutation('emp-001', 'LOC-NY', [])).toBe(false);
  });
});

describe('calculateWorkingDays', () => {
  it('counts weekdays only', () => {
    // Mon Jun 2 to Fri Jun 6 2025 = 5 working days
    expect(calculateWorkingDays('2025-06-02', '2025-06-06')).toBe(5);
  });
  it('excludes weekends', () => {
    // Mon Jun 2 to Sun Jun 8 2025 = 5 working days (Sat+Sun excluded)
    expect(calculateWorkingDays('2025-06-02', '2025-06-08')).toBe(5);
  });
  it('returns 1 for single day', () => {
    expect(calculateWorkingDays('2025-06-02', '2025-06-02')).toBe(1);
  });
});
