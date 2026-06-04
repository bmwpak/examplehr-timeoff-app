import { describe, it, expect } from 'vitest';
import { BalanceSchema, RequestSchema, safeParseHCM } from '@/lib/schemas';

describe('safeParseHCM', () => {
  it('parses a valid balance', () => {
    const result = safeParseHCM(BalanceSchema, {
      employeeId: 'emp-001',
      locationId: 'LOC-NY',
      available: 10,
      updatedAt: new Date().toISOString(),
    });
    expect(result).not.toBeNull();
    expect(result?.available).toBe(10);
  });

  it('returns null for empty object', () => {
    expect(safeParseHCM(BalanceSchema, {})).toBeNull();
  });

  it('returns null when available is missing', () => {
    expect(
      safeParseHCM(BalanceSchema, {
        employeeId: 'emp-001',
        locationId: 'LOC-NY',
        updatedAt: new Date().toISOString(),
      })
    ).toBeNull();
  });

  it('returns null when available is a string', () => {
    expect(
      safeParseHCM(BalanceSchema, {
        employeeId: 'emp-001',
        locationId: 'LOC-NY',
        available: '10',
        updatedAt: new Date().toISOString(),
      })
    ).toBeNull();
  });

  it('returns null for null input', () => {
    expect(safeParseHCM(BalanceSchema, null)).toBeNull();
  });

  it('returns null for array input', () => {
    expect(safeParseHCM(BalanceSchema, [])).toBeNull();
  });
});

describe('BalanceSchema', () => {
  it('rejects negative available balance', () => {
    const result = BalanceSchema.safeParse({
      employeeId: 'emp-001',
      locationId: 'LOC-NY',
      available: -1,
      updatedAt: new Date().toISOString(),
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid balance', () => {
    const result = BalanceSchema.safeParse({
      employeeId: 'emp-001',
      locationId: 'LOC-NY',
      available: 10,
      updatedAt: new Date().toISOString(),
    });
    expect(result.success).toBe(true);
  });
});

describe('RequestSchema', () => {
  it('accepts valid request', () => {
    const result = RequestSchema.safeParse({
      id: 'req-001',
      employeeId: 'emp-001',
      locationId: 'LOC-NY',
      startDate: '2025-07-01',
      endDate: '2025-07-03',
      daysRequested: 3,
      reason: 'Vacation',
      status: 'pending',
      submittedAt: new Date().toISOString(),
    });
    expect(result.success).toBe(true);
  });
});
