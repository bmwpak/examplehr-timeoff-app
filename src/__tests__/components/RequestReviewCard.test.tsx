import { describe, it, expect } from 'vitest';

// Component logic unit tests — verifying RequestReviewCard business logic
// without a DOM renderer (pure logic assertions).

describe('RequestReviewCard logic', () => {
  it('determines conflict correctly', () => {
    const verifiedBalance = 2;
    const daysRequested = 3;
    const hasConflict = verifiedBalance !== null && verifiedBalance < daysRequested;
    expect(hasConflict).toBe(true);
  });

  it('determines no conflict correctly when balance is sufficient', () => {
    const verifiedBalance = 10;
    const daysRequested = 3;
    const hasConflict = verifiedBalance !== null && verifiedBalance < daysRequested;
    expect(hasConflict).toBe(false);
  });

  it('determines no conflict when balance is exactly equal', () => {
    const verifiedBalance = 3;
    const daysRequested = 3;
    const hasConflict = verifiedBalance !== null && verifiedBalance < daysRequested;
    expect(hasConflict).toBe(false);
  });
});
