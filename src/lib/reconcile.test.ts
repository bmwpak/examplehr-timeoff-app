import { describe, it, expect } from 'vitest';
import { reconcile, calculateOptimisticBalance, hasInFlightMutation } from './reconcile';
import type { Balance, OptimisticEntry } from '@/types';

describe('Reconciliation Utilities', () => {
  describe('reconcile()', () => {
    it('should perform no-op when cached balances match HCM balances', () => {
      const cached = {
        'emp-001': { 'LOC-NY': 10 },
      };
      const hcm: Balance[] = [
        { employeeId: 'emp-001', locationId: 'LOC-NY', available: 10, updatedAt: '2026-06-03T10:00:00Z' },
      ];
      const optimistics: OptimisticEntry[] = [];

      const result = reconcile(cached, hcm, optimistics);
      expect(result.updates).toHaveLength(0);
      expect(result.conflicts).toHaveLength(0);
    });

    it('should silently correct cache when HCM balance differs and no in-flight mutation exists', () => {
      const cached = {
        'emp-001': { 'LOC-NY': 10 },
      };
      const hcm: Balance[] = [
        { employeeId: 'emp-001', locationId: 'LOC-NY', available: 8, updatedAt: '2026-06-03T10:00:00Z' },
      ];
      const optimistics: OptimisticEntry[] = [];

      const result = reconcile(cached, hcm, optimistics);
      expect(result.updates).toHaveLength(1);
      expect(result.updates[0]?.available).toBe(8);
      expect(result.conflicts).toHaveLength(0);
    });

    it('should detect conflict when HCM balance differs and there IS an in-flight mutation', () => {
      const cached = {
        'emp-001': { 'LOC-NY': 7 }, // 10 initial minus 3 optimistic
      };
      const hcm: Balance[] = [
        { employeeId: 'emp-001', locationId: 'LOC-NY', available: 5, updatedAt: '2026-06-03T10:00:00Z' }, // Server differs from cached (7)
      ];
      const optimistics: OptimisticEntry[] = [
        {
          requestId: 'req-1',
          employeeId: 'emp-001',
          locationId: 'LOC-NY',
          optimisticDeduction: 3,
          submittedAt: Date.now(),
        },
      ];

      const result = reconcile(cached, hcm, optimistics);
      expect(result.updates).toHaveLength(0);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0]?.cachedValue).toBe(7);
      expect(result.conflicts[0]?.hcmValue).toBe(5);
    });
  });

  describe('calculateOptimisticBalance()', () => {
    it('should deduct days correctly', () => {
      expect(calculateOptimisticBalance(10, 3)).toBe(7);
    });

    it('should return null if deduction goes negative', () => {
      expect(calculateOptimisticBalance(5, 6)).toBeNull();
    });
  });

  describe('hasInFlightMutation()', () => {
    it('should identify active in-flight request', () => {
      const optimistics: OptimisticEntry[] = [
        {
          requestId: 'req-1',
          employeeId: 'emp-001',
          locationId: 'LOC-NY',
          optimisticDeduction: 3,
          submittedAt: Date.now(),
        },
      ];
      expect(hasInFlightMutation('emp-001', 'LOC-NY', optimistics)).toBe(true);
      expect(hasInFlightMutation('emp-001', 'LOC-SF', optimistics)).toBe(false);
    });
  });
});
