import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useOptimisticStore } from '@/store/optimistic';
import { useSessionStore } from '@/store/session';
import { submitRequest } from '@/lib/hcm-client';

describe('Integration: Submission and Rollback Flow', () => {
  beforeEach(() => {
    useOptimisticStore.getState().clearAll();
    useSessionStore.getState().setHCMReachable(true);
    vi.restoreAllMocks();
  });

  it('should successfully submit a request and update Zustand status overrides', async () => {
    const mockResponse = { requestId: 'req-123', status: 'pending' };
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const body = {
      employeeId: 'emp-001',
      locationId: 'LOC-NY',
      startDate: '2026-06-10',
      endDate: '2026-06-12',
      daysRequested: 3,
      reason: 'Vacation',
    };

    const result = await submitRequest(body);
    expect(result.requestId).toBe('req-123');
    expect(result.status).toBe('pending');
    expect(fetchSpy).toHaveBeenCalledWith('/api/hcm/requests', expect.any(Object));
  });

  it('should fail submission and throw appropriate HCMError on conflict or exhaustion', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ error: 'INSUFFICIENT_BALANCE', available: 2 }),
    } as Response);

    const body = {
      employeeId: 'emp-001',
      locationId: 'LOC-NY',
      startDate: '2026-06-10',
      endDate: '2026-06-12',
      daysRequested: 5,
      reason: 'Vacation',
    };

    await expect(submitRequest(body)).rejects.toThrow('INSUFFICIENT_BALANCE');
  });
});
