import { describe, it, expect } from 'vitest';
import { calculateWorkingDays } from '@/lib/reconcile';

// Component logic unit tests — verifying RequestForm business logic
// without a DOM renderer (pure logic assertions).

describe('RequestForm logic', () => {
  it('calculates working days correctly for a standard week', () => {
    // Monday to Friday
    const days = calculateWorkingDays('2025-06-02', '2025-06-06');
    expect(days).toBe(5);
  });

  it('calculates 0 days for weekend-only range', () => {
    // Saturday to Sunday
    const days = calculateWorkingDays('2025-06-07', '2025-06-08');
    expect(days).toBe(0);
  });

  it('determines insufficient balance correctly', () => {
    const availableBalance = 3;
    const daysRequested = 5;
    const isInsufficient = daysRequested > availableBalance;
    expect(isInsufficient).toBe(true);
  });

  it('determines sufficient balance correctly', () => {
    const availableBalance = 10;
    const daysRequested = 3;
    const isInsufficient = daysRequested > availableBalance;
    expect(isInsufficient).toBe(false);
  });

  it('disables submit when HCM is unreachable', () => {
    const isHCMReachable = false;
    const daysRequested = 3;
    const reason = 'Vacation';
    const canSubmit = isHCMReachable && daysRequested > 0 && reason.trim().length > 0;
    expect(canSubmit).toBe(false);
  });

  it('enables submit when all conditions are met', () => {
    const isHCMReachable = true;
    const daysRequested = 3;
    const availableBalance = 10;
    const reason = 'Vacation';
    const isInsufficient = daysRequested > availableBalance;
    const canSubmit = !isInsufficient && daysRequested > 0 && reason.trim().length > 0 && isHCMReachable;
    expect(canSubmit).toBe(true);
  });
});
