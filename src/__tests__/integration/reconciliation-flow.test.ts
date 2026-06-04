import { describe, it, expect } from 'vitest';
import { reconcile } from '@/lib/reconcile';

describe('reconciliation detects anniversary bonus', () => {
  it('detects a bonus added mid-session', () => {
    const cache = { 'emp-001': { 'LOC-NY': 10 } };
    const hcmAfterBonus = [
      {
        employeeId: 'emp-001',
        locationId: 'LOC-NY',
        available: 12,
        updatedAt: new Date().toISOString(),
      },
    ];
    const { updates } = reconcile(cache, hcmAfterBonus, []);
    expect(updates).toHaveLength(1);
    expect(updates[0]!.available).toBe(12);
  });
});
