import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitRequest, fetchBalance } from '@/lib/hcm-client';

describe('submission flow', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetchBalance returns a valid balance', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        employeeId: 'emp-001',
        locationId: 'LOC-NY',
        available: 10,
        updatedAt: new Date().toISOString(),
      }),
    } as Response);

    const balance = await fetchBalance('emp-001', 'LOC-NY');
    expect(balance.available).toBe(10);
    expect(balance.employeeId).toBe('emp-001');
  });

  it('submitRequest returns requestId on success', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ requestId: 'req-test-1', status: 'pending' }),
    } as Response);

    const result = await submitRequest({
      employeeId: 'emp-001',
      locationId: 'LOC-NY',
      startDate: '2025-07-01',
      endDate: '2025-07-03',
      daysRequested: 3,
      reason: 'Holiday',
    });
    expect(result.requestId).toBe('req-test-1');
    expect(result.status).toBe('pending');
  });
});
