# AI AGENT INSTRUCTIONS
## ExampleHR — Time-Off Frontend — Complete Build Prompt
### For use with: Claude Code, Cursor, Windsurf, or any agentic coding tool

---

> **HOW TO USE THIS FILE**
> Paste this entire document as your first message to the AI coding agent.
> Do NOT modify it before reading it fully — the order of instructions matters.
> The agent should implement everything sequentially, committing after each phase.

---

## CONTEXT

You are building the Time-Off Management frontend for ExampleHR. This is a take-home engineering assessment. The evaluators will read your code, run your tests, and open your Storybook. They care most about:
1. Correctness of the data layer (optimistic updates, rollback, reconciliation)
2. Completeness of UI state coverage (every edge case has a story and a test)
3. Code quality (TypeScript strict, clean component boundaries, no magic numbers)

Do not write placeholder code. Do not skip edge cases. Do not leave TODO comments without implementing them. Every file you create must be production-quality.

---

## PHASE 1: PROJECT SETUP

### 1.1 Initialize the Next.js Project

```bash
npx create-next-app@latest examplehr-timeoff \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"
cd examplehr-timeoff
```

### 1.2 Install All Dependencies

```bash
# Core dependencies
npm install \
  @tanstack/react-query@^5 \
  @tanstack/react-query-devtools@^5 \
  zustand \
  zod \
  date-fns \
  clsx \
  tailwind-merge

# UI Components
npm install \
  @radix-ui/react-dialog \
  @radix-ui/react-toast \
  @radix-ui/react-tooltip \
  @radix-ui/react-badge \
  @radix-ui/react-separator \
  lucide-react

# Storybook
npx storybook@latest init --yes
npm install \
  @storybook/test \
  @storybook/addon-interactions \
  @storybook/addon-a11y \
  --save-dev

# Testing
npm install \
  vitest \
  @vitejs/plugin-react \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  msw@^2 \
  --save-dev
```

### 1.3 TypeScript Configuration

Set `tsconfig.json` to strict mode:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### 1.4 Create the File Structure

Create this exact directory structure before writing any code:

```
src/
  app/
    api/
      hcm/
        balance/[employeeId]/[locationId]/route.ts
        balances/route.ts
        requests/route.ts
        requests/[id]/approve/route.ts
        requests/[id]/deny/route.ts
        simulate/anniversary/route.ts
        simulate/config/route.ts
    employee/page.tsx
    manager/page.tsx
    layout.tsx
    page.tsx
  components/
    balance/
      BalanceCell.tsx
      BalanceGrid.tsx
      StaleIndicator.tsx
      OptimisticBadge.tsx
    request/
      RequestForm.tsx
      BalancePreview.tsx
      RequestHistory.tsx
      RequestCard.tsx
    manager/
      PendingQueue.tsx
      RequestReviewCard.tsx
      BalanceVerifiedBadge.tsx
      ConflictWarning.tsx
    shared/
      SessionBanner.tsx
      LoadingSkeleton.tsx
      ErrorBoundary.tsx
      OfflineIndicator.tsx
  hooks/
    useBalance.ts
    useAllBalances.ts
    useSubmitRequest.ts
    useApproveRequest.ts
    useDenyRequest.ts
    useReconciliation.ts
    useOptimisticStore.ts
  lib/
    hcm-client.ts
    reconcile.ts
    schemas.ts
    constants.ts
    utils.ts
  store/
    optimistic.ts
    session.ts
  types/
    index.ts
  stories/
    BalanceCell.stories.tsx
    RequestForm.stories.tsx
    RequestReviewCard.stories.tsx
    SessionBanner.stories.tsx
  __tests__/
    unit/
      reconcile.test.ts
      schemas.test.ts
      utils.test.ts
    integration/
      submission-flow.test.ts
      rollback-flow.test.ts
      reconciliation-flow.test.ts
      manager-flow.test.ts
    components/
      BalanceCell.test.tsx
      RequestForm.test.tsx
      RequestReviewCard.test.tsx
```

---

## PHASE 2: TYPES & SCHEMAS

### 2.1 `src/types/index.ts`

Define all shared types. These must be exact — every component and hook uses them:

```typescript
export type LocationId = string;
export type EmployeeId = string;
export type RequestId = string;

export interface Balance {
  employeeId: EmployeeId;
  locationId: LocationId;
  available: number;
  updatedAt: string; // ISO 8601
}

export interface TimeOffRequest {
  id: RequestId;
  employeeId: EmployeeId;
  locationId: LocationId;
  startDate: string;
  endDate: string;
  daysRequested: number;
  reason: string;
  status: RequestStatus;
  submittedAt: string;
  resolvedAt?: string;
}

export type RequestStatus =
  | 'pending-optimistic'   // Not yet sent to HCM
  | 'pending-hcm'          // Sent, awaiting HCM confirmation
  | 'pending'              // HCM confirmed, awaiting manager
  | 'approved'
  | 'denied'
  | 'rolled-back'          // HCM rejected, optimistic deduction reversed
  | 'unconfirmed';         // Silent failure — not confirmed, not denied

export interface Employee {
  id: EmployeeId;
  name: string;
  locationIds: LocationId[];
}

export interface Manager {
  id: string;
  name: string;
  managesEmployeeIds: EmployeeId[];
}

export interface HCMConfig {
  silentFailMode: boolean;
  delayMs: number;
  conflictMode: boolean;
  anniversaryBonus: number;
}

export interface OptimisticEntry {
  requestId: RequestId;
  employeeId: EmployeeId;
  locationId: LocationId;
  optimisticDeduction: number;
  submittedAt: number; // Date.now()
}

export interface ConflictEntry {
  employeeId: EmployeeId;
  locationId: LocationId;
  cachedValue: number;
  hcmValue: number;
  detectedAt: number;
}
```

### 2.2 `src/lib/schemas.ts`

Define ALL Zod schemas for HCM API responses. Every HCM response is validated through these before touching any UI state:

```typescript
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
```

---

## PHASE 3: CONSTANTS & UTILITIES

### 3.1 `src/lib/constants.ts`

```typescript
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
```

### 3.2 `src/lib/reconcile.ts`

This is the most critical pure function in the system. Test it exhaustively:

```typescript
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
```

---

## PHASE 4: ZUSTAND STORES

### 4.1 `src/store/optimistic.ts`

```typescript
import { create } from 'zustand';
import type { OptimisticEntry, ConflictEntry, RequestStatus } from '@/types';

interface OptimisticState {
  // In-flight mutations
  inFlightRequests: OptimisticEntry[];
  // Conflict detections from reconciliation
  conflicts: ConflictEntry[];
  // Per-request status overrides
  requestStatuses: Record<string, RequestStatus>;

  addInFlight: (entry: OptimisticEntry) => void;
  removeInFlight: (requestId: string) => void;
  addConflict: (conflict: ConflictEntry) => void;
  clearConflict: (employeeId: string, locationId: string) => void;
  setRequestStatus: (requestId: string, status: RequestStatus) => void;
  clearAll: () => void;
}

export const useOptimisticStore = create<OptimisticState>((set) => ({
  inFlightRequests: [],
  conflicts: [],
  requestStatuses: {},

  addInFlight: (entry) =>
    set((s) => ({ inFlightRequests: [...s.inFlightRequests, entry] })),

  removeInFlight: (requestId) =>
    set((s) => ({
      inFlightRequests: s.inFlightRequests.filter((r) => r.requestId !== requestId),
    })),

  addConflict: (conflict) =>
    set((s) => ({
      conflicts: [
        ...s.conflicts.filter(
          (c) => !(c.employeeId === conflict.employeeId && c.locationId === conflict.locationId)
        ),
        conflict,
      ],
    })),

  clearConflict: (employeeId, locationId) =>
    set((s) => ({
      conflicts: s.conflicts.filter(
        (c) => !(c.employeeId === employeeId && c.locationId === locationId)
      ),
    })),

  setRequestStatus: (requestId, status) =>
    set((s) => ({
      requestStatuses: { ...s.requestStatuses, [requestId]: status },
    })),

  clearAll: () =>
    set({ inFlightRequests: [], conflicts: [], requestStatuses: {} }),
}));
```

### 4.2 `src/store/session.ts`

```typescript
import { create } from 'zustand';

interface SessionState {
  isHCMReachable: boolean;
  lastReconciliationAt: number | null;
  reconciliationRunning: boolean;
  
  setHCMReachable: (reachable: boolean) => void;
  setReconciliationRunning: (running: boolean) => void;
  recordReconciliation: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  isHCMReachable: true,
  lastReconciliationAt: null,
  reconciliationRunning: false,

  setHCMReachable: (reachable) => set({ isHCMReachable: reachable }),
  setReconciliationRunning: (running) => set({ reconciliationRunning: running }),
  recordReconciliation: () => set({ lastReconciliationAt: Date.now(), reconciliationRunning: false }),
}));
```

---

## PHASE 5: MOCK HCM ROUTE HANDLERS

### 5.1 In-Memory Store (`src/app/api/hcm/_state.ts`)

This file holds the mutable in-memory HCM state. All route handlers import from here:

```typescript
import { SEED_BALANCES, SEED_EMPLOYEES, SEED_MANAGERS } from '@/lib/constants';
import type { TimeOffRequest, HCMConfig } from '@/types';
import { nanoid } from 'nanoid'; // npm install nanoid

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
```

### 5.2 Real-Time Balance Route (`src/app/api/hcm/balance/[employeeId]/[locationId]/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { hcmState, simulateDelay, getBalance } from '../../_state';

export async function GET(
  _req: NextRequest,
  { params }: { params: { employeeId: string; locationId: string } }
) {
  await simulateDelay();

  if (hcmState.config.silentFailMode) {
    return NextResponse.json({}, { status: 200 }); // Garbled — empty body
  }

  const available = getBalance(params.employeeId, params.locationId);

  if (available === null) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }

  return NextResponse.json({
    employeeId: params.employeeId,
    locationId: params.locationId,
    available,
    updatedAt: new Date().toISOString(),
  });
}
```

### 5.3 Batch Balances Route (`src/app/api/hcm/balances/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { hcmState, simulateDelay } from '../_state';

export async function GET(req: NextRequest) {
  // Batch is 3x slower than single cell
  await new Promise(r => setTimeout(r, hcmState.config.delayMs * 3));

  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get('employeeId');

  const results = [];
  const balances = employeeId
    ? { [employeeId]: hcmState.balances[employeeId] ?? {} }
    : hcmState.balances;

  for (const [empId, locations] of Object.entries(balances)) {
    for (const [locationId, available] of Object.entries(locations)) {
      results.push({
        employeeId: empId,
        locationId,
        available,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  return NextResponse.json(results);
}
```

### 5.4 Submit Request Route (`src/app/api/hcm/requests/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { hcmState, simulateDelay, getBalance, deductBalance, createRequestId } from '../_state';
import { z } from 'zod';

const SubmitBodySchema = z.object({
  employeeId: z.string(),
  locationId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  daysRequested: z.number().int().positive(),
  reason: z.string(),
});

export async function POST(req: NextRequest) {
  await simulateDelay();

  // Silent fail mode: return 200 with empty body
  if (hcmState.config.silentFailMode) {
    return NextResponse.json({}, { status: 200 });
  }

  const body = await req.json().catch(() => null);
  const parsed = SubmitBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'BAD_REQUEST', details: parsed.error }, { status: 400 });
  }

  const { employeeId, locationId, daysRequested, startDate, endDate, reason } = parsed.data;
  const available = getBalance(employeeId, locationId);

  if (available === null) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }

  if (available < daysRequested) {
    return NextResponse.json({ error: 'INSUFFICIENT_BALANCE', available }, { status: 409 });
  }

  const requestId = createRequestId();

  // Conflict mode: return success but do NOT deduct balance (simulates HCM inconsistency)
  if (!hcmState.config.conflictMode) {
    deductBalance(employeeId, locationId, daysRequested);
  }

  const request = {
    id: requestId,
    employeeId,
    locationId,
    startDate,
    endDate,
    daysRequested,
    reason,
    status: 'pending' as const,
    submittedAt: new Date().toISOString(),
  };

  hcmState.requests.push(request);

  return NextResponse.json({ requestId, status: 'pending' }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get('employeeId');
  const managerId = searchParams.get('managerId');

  let requests = hcmState.requests;

  if (employeeId) {
    requests = requests.filter(r => r.employeeId === employeeId);
  }

  if (managerId) {
    const manager = hcmState.managers.find(m => m.id === managerId);
    if (manager) {
      requests = requests.filter(r => (manager.managesEmployeeIds as readonly string[]).includes(r.employeeId));
    }
  }

  return NextResponse.json(requests);
}
```

### 5.5 Approve/Deny Routes

**`src/app/api/hcm/requests/[id]/approve/route.ts`:**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { hcmState, simulateDelay, getBalance, deductBalance } from '../../../_state';

export async function PUT(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await simulateDelay();

  const request = hcmState.requests.find(r => r.id === params.id);
  if (!request) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  if (request.status !== 'pending') {
    return NextResponse.json({ error: 'ALREADY_RESOLVED' }, { status: 409 });
  }

  // ALWAYS re-check balance at approval time (manager path is pessimistic)
  const available = getBalance(request.employeeId, request.locationId);
  if (available === null || available < request.daysRequested) {
    return NextResponse.json(
      { error: 'BALANCE_CHANGED', available: available ?? 0 },
      { status: 409 }
    );
  }

  deductBalance(request.employeeId, request.locationId, request.daysRequested);
  request.status = 'approved';
  request.resolvedAt = new Date().toISOString();

  return NextResponse.json({ requestId: params.id, status: 'approved' });
}
```

**`src/app/api/hcm/requests/[id]/deny/route.ts`:**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { hcmState, simulateDelay } from '../../../_state';

export async function PUT(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await simulateDelay();

  const request = hcmState.requests.find(r => r.id === params.id);
  if (!request) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

  request.status = 'denied';
  request.resolvedAt = new Date().toISOString();

  return NextResponse.json({ requestId: params.id, status: 'denied' });
}
```

### 5.6 Simulation Routes

**`src/app/api/hcm/simulate/anniversary/route.ts`:**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { addBalance } from '../../_state';
import { z } from 'zod';

const AnniversarySchema = z.object({
  employeeId: z.string(),
  locationId: z.string(),
  bonusDays: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = AnniversarySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'BAD_REQUEST' }, { status: 400 });

  addBalance(parsed.data.employeeId, parsed.data.locationId, parsed.data.bonusDays);

  return NextResponse.json({ success: true, message: `+${parsed.data.bonusDays} days granted` });
}
```

**`src/app/api/hcm/simulate/config/route.ts`:**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { hcmState } from '../../_state';
import { z } from 'zod';

const ConfigSchema = z.object({
  silentFailMode: z.boolean().optional(),
  delayMs: z.number().min(0).optional(),
  conflictMode: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = ConfigSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'BAD_REQUEST' }, { status: 400 });

  Object.assign(hcmState.config, parsed.data);

  return NextResponse.json({ config: hcmState.config });
}

export async function GET() {
  return NextResponse.json({ config: hcmState.config });
}
```

---

## PHASE 6: HCM CLIENT

### `src/lib/hcm-client.ts`

All fetch calls go through this module. It handles timeouts, schema validation, and error normalization:

```typescript
import { MUTATION_TIMEOUT } from './constants';
import { BalanceSchema, BalancesSchema, SubmitResponseSchema, ApproveResponseSchema, safeParseHCM } from './schemas';
import type { Balance, TimeOffRequest } from '@/types';

class HCMError extends Error {
  constructor(
    public code: string,
    public available?: number,
    message?: string
  ) {
    super(message ?? code);
  }
}

async function fetchWithTimeout(input: RequestInfo, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), MUTATION_TIMEOUT);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchBalance(employeeId: string, locationId: string): Promise<Balance> {
  const res = await fetchWithTimeout(`/api/hcm/balance/${employeeId}/${locationId}`);
  const json = await res.json().catch(() => null);
  const parsed = safeParseHCM(BalanceSchema, json);
  if (!parsed) throw new HCMError('SILENT_FAILURE');
  return parsed;
}

export async function fetchAllBalances(employeeId: string): Promise<Balance[]> {
  const res = await fetchWithTimeout(`/api/hcm/balances?employeeId=${employeeId}`);
  const json = await res.json().catch(() => null);
  const parsed = safeParseHCM(BalancesSchema, json);
  if (!parsed) throw new HCMError('SILENT_FAILURE');
  return parsed;
}

export async function submitRequest(body: {
  employeeId: string;
  locationId: string;
  startDate: string;
  endDate: string;
  daysRequested: number;
  reason: string;
}): Promise<{ requestId: string; status: 'pending' }> {
  const res = await fetchWithTimeout('/api/hcm/requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const errorCode = json?.error ?? 'UNKNOWN_ERROR';
    throw new HCMError(errorCode, json?.available);
  }

  const parsed = safeParseHCM(SubmitResponseSchema, json);
  if (!parsed) throw new HCMError('SILENT_FAILURE');

  return parsed;
}

export async function approveRequest(requestId: string): Promise<void> {
  const res = await fetchWithTimeout(`/api/hcm/requests/${requestId}/approve`, { method: 'PUT' });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new HCMError(json?.error ?? 'APPROVAL_FAILED', json?.available);
  }
}

export async function denyRequest(requestId: string): Promise<void> {
  const res = await fetchWithTimeout(`/api/hcm/requests/${requestId}/deny`, { method: 'PUT' });
  if (!res.ok) throw new HCMError('DENY_FAILED');
}
```

---

## PHASE 7: TANSTACK QUERY HOOKS

### `src/hooks/useBalance.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { fetchBalance } from '@/lib/hcm-client';
import { QUERY_KEYS, BALANCE_STALE_TIME, BALANCE_GC_TIME, STALE_THRESHOLD_MS } from '@/lib/constants';
import type { Balance } from '@/types';

export function useBalance(employeeId: string, locationId: string) {
  const query = useQuery({
    queryKey: QUERY_KEYS.balance(employeeId, locationId),
    queryFn: () => fetchBalance(employeeId, locationId),
    staleTime: BALANCE_STALE_TIME,
    gcTime: BALANCE_GC_TIME,
    retry: 2,
  });

  const isStale = query.dataUpdatedAt > 0
    && Date.now() - query.dataUpdatedAt > STALE_THRESHOLD_MS;

  return {
    balance: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    isStale,
    lastVerifiedAt: query.dataUpdatedAt || null,
    refetch: query.refetch,
  };
}
```

### `src/hooks/useSubmitRequest.ts`

This is the most critical hook — it handles the full optimistic mutation lifecycle:

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submitRequest } from '@/lib/hcm-client';
import { QUERY_KEYS } from '@/lib/constants';
import { useOptimisticStore } from '@/store/optimistic';
import { calculateOptimisticBalance } from '@/lib/reconcile';
import type { Balance } from '@/types';
import { nanoid } from 'nanoid';

interface SubmitParams {
  employeeId: string;
  locationId: string;
  startDate: string;
  endDate: string;
  daysRequested: number;
  reason: string;
}

export function useSubmitRequest() {
  const queryClient = useQueryClient();
  const { addInFlight, removeInFlight, setRequestStatus } = useOptimisticStore();

  return useMutation({
    mutationFn: submitRequest,

    onMutate: async (params: SubmitParams) => {
      const requestId = nanoid();
      const queryKey = QUERY_KEYS.balance(params.employeeId, params.locationId);

      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value for rollback
      const previousBalance = queryClient.getQueryData<Balance>(queryKey);

      // Apply optimistic deduction
      if (previousBalance !== undefined) {
        const newAvailable = calculateOptimisticBalance(
          previousBalance.available,
          params.daysRequested
        );
        if (newAvailable !== null) {
          queryClient.setQueryData<Balance>(queryKey, {
            ...previousBalance,
            available: newAvailable,
          });
        }
      }

      // Track in-flight mutation
      addInFlight({
        requestId,
        employeeId: params.employeeId,
        locationId: params.locationId,
        optimisticDeduction: params.daysRequested,
        submittedAt: Date.now(),
      });

      setRequestStatus(requestId, 'pending-optimistic');

      return { previousBalance, requestId, queryKey };
    },

    onSuccess: (data, _params, context) => {
      if (!context) return;
      removeInFlight(context.requestId);
      setRequestStatus(context.requestId, 'pending-hcm');
      // Invalidate to get the authoritative balance
      queryClient.invalidateQueries({ queryKey: context.queryKey });
    },

    onError: (_error, params, context) => {
      if (!context) return;
      // Rollback optimistic update
      if (context.previousBalance !== undefined) {
        queryClient.setQueryData(context.queryKey, context.previousBalance);
      }
      removeInFlight(context.requestId);
      setRequestStatus(context.requestId, 'rolled-back');
      queryClient.invalidateQueries({ queryKey: context.queryKey });
    },
  });
}
```

### `src/hooks/useApproveRequest.ts`

Pessimistic — no optimistic update. Always verifies balance first:

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { approveRequest, fetchBalance } from '@/lib/hcm-client';
import { QUERY_KEYS } from '@/lib/constants';

export function useApproveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      employeeId,
      locationId,
      daysRequested,
    }: {
      requestId: string;
      employeeId: string;
      locationId: string;
      daysRequested: number;
    }) => {
      // ALWAYS verify balance before approval — no optimistic update
      const currentBalance = await fetchBalance(employeeId, locationId);
      if (currentBalance.available < daysRequested) {
        throw new Error('INSUFFICIENT_BALANCE_AT_APPROVAL');
      }
      await approveRequest(requestId);
      return { employeeId, locationId };
    },

    onSuccess: (_data, params) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.balance(params.employeeId, params.locationId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.pendingRequests('mgr-001'),
      });
    },
  });
}
```

### `src/hooks/useReconciliation.ts`

Background reconciliation — runs every 30 seconds:

```typescript
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { fetchAllBalances } from '@/lib/hcm-client';
import { reconcile } from '@/lib/reconcile';
import { QUERY_KEYS, RECONCILIATION_INTERVAL } from '@/lib/constants';
import { useOptimisticStore } from '@/store/optimistic';
import { useSessionStore } from '@/store/session';
import type { Balance } from '@/types';

export function useReconciliation(employeeId: string) {
  const queryClient = useQueryClient();
  const { inFlightRequests, addConflict } = useOptimisticStore();
  const { setReconciliationRunning, recordReconciliation, setHCMReachable } = useSessionStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const run = async () => {
      setReconciliationRunning(true);
      try {
        const hcmBalances = await fetchAllBalances(employeeId);
        setHCMReachable(true);

        // Build current cache snapshot
        const cachedBalances: Record<string, Record<string, number>> = {};
        const queryCache = queryClient.getQueriesData<Balance>({
          queryKey: ['balance'],
        });

        for (const [queryKey, data] of queryCache) {
          if (data && Array.isArray(queryKey) && queryKey.length >= 3) {
            const empId = queryKey[1] as string;
            const locId = queryKey[2] as string;
            if (!cachedBalances[empId]) cachedBalances[empId] = {};
            cachedBalances[empId]![locId] = data.available;
          }
        }

        const { updates, conflicts } = reconcile(
          cachedBalances,
          hcmBalances,
          inFlightRequests
        );

        // Apply silent updates
        for (const updated of updates) {
          queryClient.setQueryData<Balance>(
            QUERY_KEYS.balance(updated.employeeId, updated.locationId),
            updated
          );
        }

        // Register conflicts
        for (const conflict of conflicts) {
          addConflict(conflict);
        }

        recordReconciliation();
      } catch {
        setHCMReachable(false);
        setReconciliationRunning(false);
      }
    };

    run(); // Run immediately on mount
    intervalRef.current = setInterval(run, RECONCILIATION_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [employeeId]); // eslint-disable-line react-hooks/exhaustive-deps
}
```

---

## PHASE 8: UI COMPONENTS

Build all components now. Requirements for each:

### General Rules
- Every component must be fully typed with TypeScript — no `any`.
- Every component that can be in a loading state must show a skeleton, not a spinner (skeletons preserve layout).
- Every error state must be actionable — show what went wrong AND what the user can do.
- Every balance display must show the last-verified timestamp.
- Use Tailwind for all styling. No inline styles except for dynamic values.
- All interactive elements must be keyboard accessible and have proper aria labels.

### 8.1 `src/components/balance/BalanceCell.tsx`

Props:
```typescript
interface BalanceCellProps {
  balance: Balance | null;
  isLoading: boolean;
  isStale: boolean;
  isOptimisticPending: boolean;
  wasRolledBack: boolean;
  lastVerifiedAt: number | null;
}
```

Renders: location name, available days, stale indicator if `isStale`, optimistic badge if `isOptimisticPending`, rollback flash if `wasRolledBack`, skeleton if `isLoading`.

### 8.2 `src/components/balance/StaleIndicator.tsx`

A small badge that shows "Updated X min ago" when data is stale. Use `date-fns/formatDistanceToNow`.

### 8.3 `src/components/balance/OptimisticBadge.tsx`

A badge with a pulsing dot: "Pending confirmation". Disappears when request is confirmed.

### 8.4 `src/components/request/RequestForm.tsx`

Props: `{ employeeId, locationId, availableBalance, onSuccess }`

Features:
- Date range picker (start + end date, HTML date inputs)
- `daysRequested` auto-calculated from date range
- `BalancePreview` component shows remaining balance after request
- Submit button disabled if: `daysRequested > availableBalance`, balance not yet verified, HCM unreachable, or form invalid
- On submit: calls `useSubmitRequest`, shows loading state, handles all error cases inline

### 8.5 `src/components/request/BalancePreview.tsx`

Shows: "After this request: X days remaining" with green/red color based on whether it's positive.

### 8.6 `src/components/manager/RequestReviewCard.tsx`

This component MUST:
1. On mount: immediately fire a real-time balance fetch (show skeleton until complete)
2. Only render the Approve/Deny buttons AFTER the balance is verified
3. Show `BalanceVerifiedBadge` with timestamp
4. If the current balance < daysRequested: show `ConflictWarning` and disable Approve button
5. Approve calls `useApproveRequest` (pessimistic)
6. Deny calls `useDenyRequest`

### 8.7 `src/components/shared/SessionBanner.tsx`

Reads from Zustand session store. Shows:
- Red bar if `!isHCMReachable`: "HCM is unreachable — balance data may be stale"
- Yellow bar if conflicts exist: "Balance conflict detected for X employees"
- Subtle bar if reconciliation running: small spinner + "Checking for balance updates..."

---

## PHASE 9: PAGES

### `src/app/employee/page.tsx`

```typescript
// Demo: hardcoded to emp-001 for assessment purposes
// Real app would read from session/auth context

// Layout:
// - Header: "Alice Chen — Time Off"
// - BalanceGrid: shows all locations for emp-001
// - RequestForm: below the grid
// - RequestHistory: below the form
// - SessionBanner: top of page
// - useReconciliation('emp-001') started here
```

### `src/app/manager/page.tsx`

```typescript
// Demo: hardcoded to mgr-001

// Layout:
// - Header: "Carol Wu — Manager View"
// - PendingQueue: list of all pending requests for Carol's reports
// - Each item expands to RequestReviewCard
// - SessionBanner: top of page
```

### `src/app/page.tsx`

Landing page with two links: "Employee View" and "Manager View". Include a "Simulation Controls" section that calls `/api/hcm/simulate/config` to toggle modes. This is essential for Storybook and manual testing.

---

## PHASE 10: STORYBOOK STORIES

### Setup

In `.storybook/preview.tsx`, wrap all stories with the TanStack Query provider:

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

export const decorators = [
  (Story) => (
    <QueryClientProvider client={queryClient}>
      <Story />
    </QueryClientProvider>
  ),
];
```

### Story Rules
- Every story uses MSW (`msw-storybook-addon`) to intercept fetch calls — no real API calls.
- Every story has a `play` function that asserts the DOM state using `@storybook/test`.
- Story names exactly match the matrix in §8 of the TRD.

### `src/stories/BalanceCell.stories.tsx`

Write all 7 stories from the TRD §8.1 matrix. Example:

```typescript
export const OptimisticPending: Story = {
  args: {
    balance: { employeeId: 'emp-001', locationId: 'LOC-NY', available: 7, updatedAt: new Date().toISOString() },
    isLoading: false,
    isStale: false,
    isOptimisticPending: true,
    wasRolledBack: false,
    lastVerifiedAt: Date.now(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/pending confirmation/i)).toBeInTheDocument();
    await expect(canvas.getByText('7')).toBeInTheDocument();
  },
};
```

### `src/stories/RequestForm.stories.tsx`

Write all 8 stories from TRD §8.2. For the `HCMRejected` story:

```typescript
export const HCMRejected: Story = {
  parameters: {
    msw: {
      handlers: [
        http.post('/api/hcm/requests', () =>
          HttpResponse.json({ error: 'INSUFFICIENT_BALANCE', available: 2 }, { status: 409 })
        ),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Fill in form
    await userEvent.type(canvas.getByLabelText(/start date/i), '2025-07-01');
    await userEvent.type(canvas.getByLabelText(/end date/i), '2025-07-05');
    await userEvent.click(canvas.getByRole('button', { name: /submit/i }));
    // Assert error shown, balance restored
    await waitFor(() => {
      expect(canvas.getByText(/insufficient balance/i)).toBeInTheDocument();
    });
  },
};
```

### `src/stories/RequestReviewCard.stories.tsx`

Write all 7 stories from TRD §8.3. Critical: the `VerifyingBalance` story must show a skeleton, and the `BalanceConflict` story must show the warning banner with the approve button disabled.

### `src/stories/SessionBanner.stories.tsx`

Write all 5 stories from TRD §8.4.

---

## PHASE 11: TESTS

### `src/__tests__/unit/reconcile.test.ts`

Write tests for EVERY branch of the `reconcile` function:
1. No differences → empty result
2. HCM differs, no in-flight → update
3. HCM differs, in-flight present → conflict
4. Multiple cells, mixed scenarios
5. `calculateOptimisticBalance`: positive result, zero result, negative result (returns null)
6. `hasInFlightMutation`: true case, false case

### `src/__tests__/unit/schemas.test.ts`

Test `safeParseHCM` with:
1. Valid balance → parses correctly
2. Empty object → returns null
3. Missing required field → returns null
4. Wrong type (available as string) → returns null
5. Valid but extra fields → passes (Zod strips by default)

### `src/__tests__/integration/submission-flow.test.ts`

Use MSW to mock the API. Test the full flow:
1. Render employee view
2. Assert initial balance shown
3. Fill and submit request form
4. Assert optimistic deduction immediately applied
5. Assert "pending confirmation" badge shown
6. Wait for MSW handler to respond
7. Assert final balance matches HCM response

### `src/__tests__/integration/rollback-flow.test.ts`

Same setup but MSW returns 409:
1. Render with balance = 10
2. Submit request for 3 days
3. Assert optimistic balance shows 7
4. MSW returns `{ error: 'INSUFFICIENT_BALANCE', available: 2 }`
5. Assert balance restored to 10
6. Assert error message shown
7. Assert form preserved (data not cleared)

### `src/__tests__/integration/reconciliation-flow.test.ts`

Use fake timers:
1. Render employee view with initial balance = 10
2. Advance timer by 30s (triggers reconciliation)
3. MSW returns updated balance = 12 (anniversary bonus)
4. Assert balance updated to 12
5. Assert toast shown: "Balance updated"

### `src/__tests__/components/RequestForm.test.tsx`

1. Submit button disabled when `daysRequested > availableBalance`
2. Submit button disabled when balance unverified
3. `BalancePreview` shows correct remaining days
4. Form preserved after HCM rejection
5. Form cleared after success

---

## PHASE 12: README

Write `README.md` with:

```markdown
# ExampleHR — Time-Off Management Frontend

## Quick Start (single command)

\`\`\`bash
npm install && npm run dev
\`\`\`

Open http://localhost:3000

## Views
- http://localhost:3000/employee — Employee view (Alice Chen, emp-001)
- http://localhost:3000/manager — Manager view (Carol Wu, mgr-001)

## Simulation Controls
Available on the landing page at http://localhost:3000

Or call directly:
\`\`\`bash
# Enable silent fail mode
curl -X POST http://localhost:3000/api/hcm/simulate/config \
  -H "Content-Type: application/json" \
  -d '{"silentFailMode": true}'

# Trigger anniversary bonus
curl -X POST http://localhost:3000/api/hcm/simulate/anniversary \
  -H "Content-Type: application/json" \
  -d '{"employeeId": "emp-001", "locationId": "LOC-NY", "bonusDays": 2}'

# Add artificial delay (ms)
curl -X POST http://localhost:3000/api/hcm/simulate/config \
  -H "Content-Type: application/json" \
  -d '{"delayMs": 3000}'
\`\`\`

## Storybook

\`\`\`bash
npm run storybook
\`\`\`

Open http://localhost:6006

## Tests

\`\`\`bash
npm run test          # Unit + integration
npm run test:coverage # With coverage report
\`\`\`

## Architecture Decisions

See TRD_ExampleHR_TimeOff.md for full reasoning.
```

---

## PHASE 13: FINAL QUALITY CHECKS

Before considering the build complete, verify:

**TypeScript:**
```bash
npx tsc --noEmit
# Must pass with zero errors
```

**Tests:**
```bash
npm run test
# All tests must pass
```

**Storybook:**
```bash
npm run storybook
# All stories must render without console errors
# All play() functions must pass
```

**Linting:**
```bash
npm run lint
# Zero errors, zero warnings
```

**Bundle size:**
```bash
# Confirm .zip (excluding node_modules) is under 50MB
zip -r submission.zip . --exclude "*/node_modules/*" --exclude "*/.next/*" --exclude "*/.git/*"
ls -lh submission.zip
```

---

## CRITICAL INVARIANTS — Never Violate These

1. **Never show "Approved" to a user if HCM has not confirmed it.** `pending-optimistic` and `pending-hcm` are distinct states that must display differently.
2. **Never leave a UI in permanent optimistic state.** Every mutation has a timeout. If no response in 10s → rollback and show error.
3. **Never let a manager approve without real-time balance verification.** The approval buttons must not render until the balance fetch resolves.
4. **Never silently overwrite a cell that has an in-flight mutation.** The reconciliation logic checks for in-flight mutations and defers to conflicts instead.
5. **Never let a HCM response bypass Zod schema validation.** All responses go through `safeParseHCM` — if validation fails, treat as error.
6. **Never hardcode timing values in components.** All timing constants live in `src/lib/constants.ts`.

---

## DONE

When all 13 phases are complete and all checks pass, the submission is ready.

Zip the project (excluding node_modules, .next, .git) and submit via the Google Form.
```

