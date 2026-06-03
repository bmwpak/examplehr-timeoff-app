# ExampleHR Time-Off Management System

A high-reliability, production-grade time-off request frontend system built with Next.js 16, React 19, TypeScript, TanStack Query (React Query) v5, and Zustand. 

This application simulates real-world asynchronous HR integrations where a core database (HCM) resides downstream. The design solves latency, network dropouts, silent server failures, and out-of-order background updates while keeping the UI responsive and consistent.

---

## Architecture & Reliability Model

### 1. Asynchronous Submission & Optimistic Updates
- **Instant Response**: Submitting a request updates the employee's available balance in the UI instantly (optimistic deduction) using a date range workdays calculator (`differenceInCalendarDays` from `date-fns`).
- **In-flight Tracking**: While the POST request is in-flight to the HCM backend, a custom Zustand optimistic store tracks the transaction and displays a pulsing "Pending confirmation" badge.
- **Rollback Safety**: If the API resolves with a failure or times out, the local cache rolls back to the snapshotted pre-mutation state, flashes a red warning, and keeps the request form inputs intact for recovery.

### 2. Silent Failure Recovery
- **Timeout Threshold**: API requests time out at `10,000ms` (configured in constants). If no response is received in this window, the mutation is canceled and treated as a silent failure.
- **Recovery State**: Silent failures trigger a cache rollback, clear the optimistic status, and present a descriptive error notice to allow retry actions.

### 3. Background Batch Reconciliation
- **Periodic Sync**: A custom React Hook (`useReconciliation`) queries all employee balances every `30 seconds`.
- **Diffing Rules**:
  - **No Discrepancy**: If the server's balance matches the client's cache, it's a no-op.
  - **Silent Adjustment**: If the server's balance differs and there are **no** in-flight optimistic mutations, the local cache silently updates (e.g. automatically applying anniversary bonus days).
  - **Conflict Registry**: If the server's balance differs but there **is** an active in-flight mutation for that location, a conflict is registered. Further submissions for that location are disabled until resolved.

### 4. Manager Pessimistic Validation
- **On-mount Fetch**: When the manager views the pending requests queue, the card immediately fetches the employee's live available balance.
- **Pre-action Verification**: Approve/Deny buttons are rendered only after the balance is successfully verified. If the available balance is less than the requested days, the approve button is disabled and an alert warning is shown.

---

## Simulation Control Panel
Located on the homepage (`/`), the Simulator panel lets you manually trigger:
- **Server Latency**: Increase latency (up to 15s) to test long-running operations or force silent timeouts.
- **Silent Failures**: Toggle empty-response failures (HTTP 200 with empty body).
- **HCM Inconsistency**: Returns success on request creation without deducting server-side balance (triggers background reconciliation conflicts).
- **Anniversary Bonuses**: Manually credit extra days on the server to observe background reconciliation auto-updating the client.

---

## Directory Structure

```
├── .storybook/          # Storybook configuration & decorators
├── src/
│   ├── app/             # Next.js App Router (pages & API endpoints)
│   │   ├── api/hcm/     # Mock HCM mock database and route endpoints
│   │   ├── employee/    # Employee View page
│   │   ├── manager/     # Manager View page
│   │   ├── layout.tsx   # Global Layout with nav/footer & providers
│   │   └── providers.tsx# Query Client Provider
│   ├── components/      # React Presentation Components
│   │   ├── balance/     # Balance cells, stale indicators, grids
│   │   ├── request/     # Date calculation forms, history lists, remaining badges
│   │   ├── manager/     # Verification queues, conflict warnings
│   │   └── shared/      # Offline widgets, session banners, loading skeletons
│   ├── hooks/           # TanStack Query & background sync hooks
│   ├── lib/             # API client, reconciliation diffing, schemas, constants
│   ├── store/           # Zustand stores for session and optimistic overrides
│   └── types/           # Core TypeScript type definitions
└── src/tests/           # Unit & Integration test suites
```

---

## Getting Started

### 1. Installation
Install project dependencies:
```bash
npm install
```

### 2. Development Server
Start the Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Running Tests
Run the Vitest test suite (Unit & Integration tests):
```bash
npm test
```

### 4. Storybook Components Explorer
Start Storybook:
```bash
npm run storybook
```
Open [http://localhost:6006](http://localhost:6006) to explore stories for `BalanceCell`, `RequestForm`, `RequestReviewCard`, and `SessionBanner`.
