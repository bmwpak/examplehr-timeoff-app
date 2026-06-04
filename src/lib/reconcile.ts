import type { Balance, ConflictEntry, OptimisticEntry } from '@/types';

export interface ReconcileResult {
  updates: Balance[];
  conflicts: ConflictEntry[];
}

/**
 * Diffs fresh HCM batch data against the current cache.
 * 
 * Rules:
 * - If hcm value !== cached value AND no in-flight optimistic mutation: 
 *     → add to updates (silent cache correction)
 * - If hcm value !== cached value AND there IS an in-flight mutation:
 *     → add to conflicts (do NOT update cache, wait for mutation to resolve)
 * - If hcm value === cached value: no action
 */
export function reconcile(
  cachedBalances: Record<string, Record<string, number>>,
  hcmBalances: Balance[],
  inFlightOptimistics: OptimisticEntry[],
  now: number = Date.now()
): ReconcileResult {
  const updates: Balance[] = [];
  const conflicts: ConflictEntry[] = [];

  const inFlightKeys = new Set(
    inFlightOptimistics.map(o => `${o.employeeId}:${o.locationId}`)
  );

  for (const hcmBalance of hcmBalances) {
    const { employeeId, locationId, available } = hcmBalance;
    const cached = cachedBalances[employeeId]?.[locationId];
    
    if (cached === undefined || cached === available) continue;

    const key = `${employeeId}:${locationId}`;

    if (inFlightKeys.has(key)) {
      conflicts.push({
        employeeId,
        locationId,
        cachedValue: cached,
        hcmValue: available,
        detectedAt: now,
      });
    } else {
      updates.push(hcmBalance);
    }
  }

  return { updates, conflicts };
}

/**
 * Calculates the optimistic balance after a deduction.
 * Returns null if the deduction would go negative (client-side guard).
 */
export function calculateOptimisticBalance(
  current: number,
  daysRequested: number
): number | null {
  const result = current - daysRequested;
  return result >= 0 ? result : null;
}

/**
 * Determines if a balance cell has an in-flight optimistic mutation.
 */
export function hasInFlightMutation(
  employeeId: string,
  locationId: string,
  optimistics: OptimisticEntry[]
): boolean {
  return optimistics.some(
    o => o.employeeId === employeeId && o.locationId === locationId
  );
}

/**
 * Calculates number of working days between two ISO date strings.
 * Excludes weekends. Simple approximation for demo purposes.
 */
export function calculateWorkingDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let count = 0;
  const current = new Date(start);

  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }

  return count;
}
