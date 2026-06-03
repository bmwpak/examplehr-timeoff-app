// All timing values in milliseconds — never hardcode these in components
export const BALANCE_STALE_TIME = 60_000;         // 1 minute
export const BALANCE_GC_TIME = 5 * 60_000;        // 5 minutes
export const RECONCILIATION_INTERVAL = 30_000;    // 30 seconds
export const MUTATION_TIMEOUT = 10_000;           // 10 seconds before treating as silent failure
export const STALE_THRESHOLD_MS = 2 * 60_000;     // Show stale indicator after 2 minutes

// Query keys — single source of truth
export const QUERY_KEYS = {
  balance: (employeeId: string, locationId: string) => ['balance', employeeId, locationId] as const,
  allBalances: (employeeId: string) => ['balances', employeeId] as const,
  requests: (employeeId: string) => ['requests', employeeId] as const,
  pendingRequests: (managerId: string) => ['pending-requests', managerId] as const,
};

// Seed data — used in route handlers and tests
export const SEED_EMPLOYEES = [
  { id: 'emp-001', name: 'Alice Chen', locationIds: ['LOC-NY', 'LOC-SF'] },
  { id: 'emp-002', name: 'Bob Patel', locationIds: ['LOC-NY'] },
] as const;

export const SEED_MANAGERS = [
  { id: 'mgr-001', name: 'Carol Wu', managesEmployeeIds: ['emp-001', 'emp-002'] },
] as const;

export const SEED_BALANCES: Record<string, Record<string, number>> = {
  'emp-001': { 'LOC-NY': 10, 'LOC-SF': 5 },
  'emp-002': { 'LOC-NY': 3 },
};

export const LOCATIONS: Record<string, string> = {
  'LOC-NY': 'New York',
  'LOC-SF': 'San Francisco',
};
