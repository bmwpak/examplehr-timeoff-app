import { z } from 'zod';

export const BalanceSchema = z.object({
  employeeId: z.string().min(1),
  locationId: z.string().min(1),
  available: z.number().int().min(0),
  updatedAt: z.string().datetime(),
});

export const BalancesSchema = z.array(BalanceSchema);

export const RequestSchema = z.object({
  id: z.string().min(1),
  employeeId: z.string().min(1),
  locationId: z.string().min(1),
  startDate: z.string(),
  endDate: z.string(),
  daysRequested: z.number().int().positive(),
  reason: z.string(),
  status: z.enum(['pending', 'approved', 'denied']),
  submittedAt: z.string().datetime(),
  resolvedAt: z.string().datetime().optional(),
});

export const SubmitResponseSchema = z.object({
  requestId: z.string(),
  status: z.literal('pending'),
});

export const ApproveResponseSchema = z.object({
  requestId: z.string(),
  status: z.literal('approved'),
});

export const HCMErrorSchema = z.object({
  error: z.enum(['INSUFFICIENT_BALANCE', 'BALANCE_CHANGED', 'INVALID_DIMENSION', 'NOT_FOUND']),
  available: z.number().optional(),
  message: z.string().optional(),
});

// Utility: parse and return null on failure (never throw to UI)
export function safeParseHCM<T>(schema: z.ZodType<T>, data: unknown): T | null {
  const result = schema.safeParse(data);
  return result.success ? result.data : null;
}
