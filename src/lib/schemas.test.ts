import { describe, it, expect } from 'vitest';
import { BalanceSchema, safeParseHCM } from './schemas';

describe('Validation Schemas', () => {
  describe('BalanceSchema', () => {
    it('should validate valid balance object', () => {
      const valid = {
        employeeId: 'emp-001',
        locationId: 'LOC-NY',
        available: 10,
        updatedAt: new Date().toISOString(),
      };
      const result = BalanceSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should fail invalid available balance number', () => {
      const invalid = {
        employeeId: 'emp-001',
        locationId: 'LOC-NY',
        available: -1, // Negative number fails min(0) rule
        updatedAt: new Date().toISOString(),
      };
      const result = BalanceSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('safeParseHCM()', () => {
    it('should return parsed data on success', () => {
      const schema = BalanceSchema;
      const valid = {
        employeeId: 'emp-002',
        locationId: 'LOC-SF',
        available: 5,
        updatedAt: new Date().toISOString(),
      };
      const parsed = safeParseHCM(schema, valid);
      expect(parsed).not.toBeNull();
      expect(parsed?.employeeId).toBe('emp-002');
    });

    it('should return null on parsing failure without throwing', () => {
      const schema = BalanceSchema;
      const invalid = {
        employeeId: '',
        locationId: 'LOC-SF',
        available: 5,
        updatedAt: 'invalid-date-format',
      };
      const parsed = safeParseHCM(schema, invalid);
      expect(parsed).toBeNull();
    });
  });
});
