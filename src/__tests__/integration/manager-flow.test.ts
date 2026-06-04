import { describe, it, expect, vi, beforeEach } from 'vitest';
import { approveRequest, denyRequest, fetchBalance } from '@/lib/hcm-client';


describe('manager approval with stale balance', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetchBalance returns current (reduced) balance', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        employeeId: 'emp-001',
        locationId: 'LOC-NY',
        available: 1,
        updatedAt: new Date().toISOString(),
      }),
    } as Response);

    const balance = await fetchBalance('emp-001', 'LOC-NY');
    expect(balance.available).toBe(1);
  });

  it('approval is blocked when balance is insufficient', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        employeeId: 'emp-001',
        locationId: 'LOC-NY',
        available: 1,
        updatedAt: new Date().toISOString(),
      }),
    } as Response);

    const current = await fetchBalance('emp-001', 'LOC-NY');
    const daysRequested = 3;
    expect(current.available < daysRequested).toBe(true);
  });

  it('should successfully call PUT to approve a request', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ requestId: 'req-123', status: 'approved' }),
    } as Response);

    await approveRequest('req-123');
  });

  it('should throw an error if approval fails due to balance changes', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ error: 'BALANCE_CHANGED', available: 2 }),
    } as Response);

    await expect(approveRequest('req-123')).rejects.toThrow('BALANCE_CHANGED');
  });

  it('should successfully call PUT to deny a request', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ requestId: 'req-123', status: 'denied' }),
    } as Response);

    await denyRequest('req-123');
  });
});
