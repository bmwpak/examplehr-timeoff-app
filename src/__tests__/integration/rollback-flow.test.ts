import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitRequest } from '@/lib/hcm-client';
import { HCMError } from '@/lib/hcm-client';

describe('rollback flow', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('submitRequest throws HCMError on 409', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ error: 'INSUFFICIENT_BALANCE', available: 2 }),
    } as Response);

    await expect(
      submitRequest({
        employeeId: 'emp-001',
        locationId: 'LOC-NY',
        startDate: '2025-07-01',
        endDate: '2025-07-05',
        daysRequested: 5,
        reason: 'Holiday',
      })
    ).rejects.toThrow(HCMError);
  });

  it('throws with INSUFFICIENT_BALANCE code', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ error: 'INSUFFICIENT_BALANCE', available: 2 }),
    } as Response);

    try {
      await submitRequest({
        employeeId: 'emp-001',
        locationId: 'LOC-NY',
        startDate: '2025-07-01',
        endDate: '2025-07-05',
        daysRequested: 5,
        reason: 'Holiday',
      });
    } catch (err) {
      expect((err as HCMError).code).toBe('INSUFFICIENT_BALANCE');
      expect((err as HCMError).available).toBe(2);
    }
  });
});
