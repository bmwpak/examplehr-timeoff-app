import { describe, it, expect, vi, beforeEach } from 'vitest';
import { approveRequest, denyRequest } from '@/lib/hcm-client';

describe('Integration: Manager Approval and Denial Flow', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should successfully call PUT to approve a request', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ requestId: 'req-123', status: 'approved' }),
    } as Response);

    await approveRequest('req-123');
    expect(fetchSpy).toHaveBeenCalledWith('/api/hcm/requests/req-123/approve', { method: 'PUT', signal: expect.any(AbortSignal) });
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
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ requestId: 'req-123', status: 'denied' }),
    } as Response);

    await denyRequest('req-123');
    expect(fetchSpy).toHaveBeenCalledWith('/api/hcm/requests/req-123/deny', { method: 'PUT', signal: expect.any(AbortSignal) });
  });
});
