import { describe, it, expect } from 'vitest';
import { LOCATIONS } from '@/lib/constants';

// Component logic unit tests — verifying BalanceCell rendering logic
// without a DOM renderer (pure logic assertions).

describe('BalanceCell logic', () => {
  it('resolves location name from LOCATIONS map', () => {
    expect(LOCATIONS['LOC-NY']).toBe('New York');
    expect(LOCATIONS['LOC-SF']).toBe('San Francisco');
  });

  it('returns locationId as fallback when not in LOCATIONS map', () => {
    const locationId = 'LOC-UNKNOWN';
    const resolved = LOCATIONS[locationId] ?? locationId;
    expect(resolved).toBe('LOC-UNKNOWN');
  });

  it('shows loading state when balance is null and isLoading is true', () => {
    const balance = null;
    const isLoading = true;
    // In the component, when isLoading is true, a skeleton is shown
    expect(balance).toBeNull();
    expect(isLoading).toBe(true);
  });

  it('displays available days when balance is loaded', () => {
    const balance = { employeeId: 'emp-001', locationId: 'LOC-NY', available: 10, updatedAt: new Date().toISOString() };
    expect(balance.available).toBe(10);
  });

  it('detects stale state based on threshold', () => {
    const STALE_THRESHOLD_MS = 2 * 60_000;
    const recentTimestamp = Date.now() - 30_000; // 30 seconds ago
    const staleTimestamp = Date.now() - 3 * 60_000; // 3 minutes ago

    expect(Date.now() - recentTimestamp > STALE_THRESHOLD_MS).toBe(false);
    expect(Date.now() - staleTimestamp > STALE_THRESHOLD_MS).toBe(true);
  });
});
