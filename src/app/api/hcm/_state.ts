import { SEED_BALANCES, SEED_EMPLOYEES, SEED_MANAGERS } from '@/lib/constants';
import type { TimeOffRequest, HCMConfig } from '@/types';
import { nanoid } from 'nanoid';

// Deep clone seed data to allow mutation
export const hcmState = {
  balances: structuredClone(SEED_BALANCES) as Record<string, Record<string, number>>,
  requests: [] as TimeOffRequest[],
  employees: SEED_EMPLOYEES,
  managers: SEED_MANAGERS,
  config: {
    silentFailMode: false,
    delayMs: 0,
    conflictMode: false,
    anniversaryBonus: 0,
  } as HCMConfig,
};

export function simulateDelay(): Promise<void> {
  if (hcmState.config.delayMs <= 0) return Promise.resolve();
  return new Promise((r) => setTimeout(r, hcmState.config.delayMs));
}

export function getBalance(employeeId: string, locationId: string): number | null {
  return hcmState.balances[employeeId]?.[locationId] ?? null;
}

export function deductBalance(employeeId: string, locationId: string, days: number): boolean {
  const current = getBalance(employeeId, locationId);
  if (current === null || current < days) return false;
  if (!hcmState.balances[employeeId]) hcmState.balances[employeeId] = {};
  hcmState.balances[employeeId]![locationId] = current - days;
  return true;
}

export function addBalance(employeeId: string, locationId: string, days: number): void {
  if (!hcmState.balances[employeeId]) hcmState.balances[employeeId] = {};
  hcmState.balances[employeeId]![locationId] = (hcmState.balances[employeeId]![locationId] ?? 0) + days;
}

export function createRequestId(): string {
  return `req-${nanoid(8)}`;
}
