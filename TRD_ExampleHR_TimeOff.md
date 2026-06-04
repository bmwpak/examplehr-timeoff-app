# Technical Requirements Document (TRD) — ExampleHR Time-Off Management

---

## §1 Executive Summary

The primary objective of the ExampleHR Time-Off Management module is to reconcile the tension between **system correctness** and **user interface speed**. The Human Capital Management (HCM) system remains the ultimate system of record (Source of Truth) for employee time-off data. However, direct synchronization with the HCM introduces significant latency, rendering the user experience slow and unresponsive.

To resolve this challenge, our solution maintains a parallel state architecture:
1. **Server State (TanStack Query)**: Captures the latest verified data from the HCM.
2. **Client State (Zustand)**: Orchestrates optimistic updates, session states, offline status, and conflict queues.

Our design enables **optimistic UI updates** during submission, which immediately update cached balances and display in-flight request statuses, while a background **reconciliation engine** runs every 30 seconds to fetch, diff, and reconcile cached states with the HCM. If a difference is found without in-flight mutations, the UI silently updates; if an in-flight mutation exists, a conflict is raised. Pessimistic manager approvals guarantee that no request can be approved without real-time balance validation, ensuring complete correctness.

---

## §2 Problem Analysis

Managing time-off balances across decoupled systems introduces complex synchronization and consistency challenges. Here is an analysis of the five core problems addressed by our architecture:

### 2.1 Instant Feedback vs Correctness
*   **Why it's hard**: A naive solution waits for the HCM API response before reflecting changes. Given network latencies (500ms to 2s), the UI feels sluggish, and users may double-submit. Conversely, immediately showing a successful confirmation state can mislead users if the HCM later rejects the mutation (e.g., due to parallel actions or system failures).
*   **Failure scenarios**: An employee requests 5 days off. The frontend shows "Approved" immediately. The browser tab is closed. Behind the scenes, the HCM rejects the request due to an insufficient balance. The employee assumes their leave is approved, causing unexpected absence.
*   **User impact**: Frustration, loss of trust in the system, and operational disruptions due to unapproved absences.

### 2.2 Stale Data Management
*   **Why it's hard**: Balances are dynamic. Anniversary bonuses, manual corrections by HR, or other requests approved in the background can alter the true balance. Storing balances indefinitely in frontend memory leads to stale states.
*   **Failure scenarios**: An employee views a cached balance of 10 days, but HR manually deducted 5 days earlier that morning. The employee submits a request for 6 days. The submission fails on the backend, forcing the UI to roll back, leaving the user confused.
*   **User impact**: Employees plan vacations based on incorrect information, leading to denied plans.

### 2.3 Mid-Flight Reconciliation Collisions
*   **Why it's hard**: A background polling cycle could return a new balance from the HCM while a user is actively submitting a request. Silently overwriting the local cache during this window would wipe out the user's optimistic deduction.
*   **Failure scenarios**: An employee with 10 days submits a 3-day request (optimistically deducting to 7). While the request is in-flight, a background polling cycle completes. It finds the HCM balance is still 10 (since the HCM has not processed the new request yet) and overwrites the local cache back to 10, hiding the pending deduction.
*   **User impact**: The UI flickers, showing incorrect balances, and may allow the employee to double-submit, exceeding their real balance.

### 2.4 Defensive Degradation Against HCM Failures
*   **Why it's hard**: Third-party APIs suffer from intermittent downtime, slow responses, or uninformative error payloads. The UI must degrade gracefully without hanging or locking up the application.
*   **Failure scenarios**: The HCM goes offline or becomes extremely slow. A user submits a request, and the frontend waits indefinitely for a response, freezing the form inputs.
*   **User impact**: Severe user frustration; users assume the application is broken.

### 2.5 Real-Time Manager Approvals
*   **Why it's hard**: Between the time an employee submits a request and the manager reviews it, the employee's balance might change. Relying on stale submission-time balances risks over-allocation.
*   **Failure scenarios**: An employee submits two parallel requests for 8 days each, with a balance of 10. Both submissions succeed optimistically. The manager reviews request A (8 days) and request B (8 days) using stale data. Both show as valid, and both are approved, causing the balance to drop to -6.
*   **User impact**: Negative balances, broken HR policy, and manual corrections required by HR personnel.

---

## §3 Solution Overview

Our solution bridges the gap between speed and correctness by introducing a **decoupled state model** and a **real-time background reconciliation loop**:

```
+--------------------------------------------------------------+
|                          Web App UI                          |
+--------------------------------------------------------------+
        ^                                            ^
        | (Zustand Client State)                     | (TanStack Server State)
        v                                            v
+-------------------------+                 +------------------+
|   Optimistic Store &    |                 |  Cached Balances |
|     Conflict Queue      |                 |    & Requests    |
+-------------------------+                 +------------------+
        ^                                            ^
        |                                            |
        |              (Background Sync)             |
        +------------------ Reconcile ---------------+
                                 ^
                                 | (HTTP)
                                 v
+--------------------------------------------------------------+
|                          HCM Server                          |
+--------------------------------------------------------------+
```

### 3.1 Optimistic Updates with Rollback
When an employee submits a request, we immediately deduct the days from the cached balance, add the request to our local in-flight queue (`inFlightRequests`), and trigger the POST request to the HCM. 
If the API call is successful, the in-flight entry is removed, and the server cache is updated. If the API fails or times out (10-second limit), we execute a **rollback path** using the stored `previousBalance` context to restore the cache and display an error message.

### 3.2 Real-Time Manager Verification
To ensure managers never approve requests on stale data, the approval screen implements a **pessimistic verification workflow**. The `Approve` button is disabled and hidden until a fresh balance check (`fetchBalance`) completes. If the verified balance is less than the requested days, the UI displays a warning banner and blocks approval.

### 3.3 Background Reconciliation Engine
Every 30 seconds, a background worker polls the batch balances endpoint. It compares the cache with the HCM balances:
*   **No Active In-flight Mutation**: If a cached balance differs from the HCM balance, we update the cache.
*   **Active In-flight Mutation**: If the cached balance differs but an in-flight mutation exists for that cell, we register a **conflict** in Zustand and preserve the optimistic state until the request resolves.

---

## §4 Architectural Decisions

### 4.1 Optimistic Updates vs. Pessimistic Updates
*   **Choice**: Optimistic updates for submissions; pessimistic verification for approvals.
*   **Rationale**: Employees demand instant feedback when requesting time off. Waiting for network round-trips is frustrating. However, managers require absolute accuracy. Approving a request on stale data violates core business invariants.
*   **Alternatives considered**: 
    *   *Fully Pessimistic*: Waiting for HCM to confirm before showing the request. Rejected due to poor user experience.
    *   *Fully Optimistic*: Allowing managers to approve optimistically and handling over-allocation later. Rejected because it violates HR safety regulations.
*   **Tradeoffs**: Adds state complexity (requires rollback logic, timeout managers, and cache restores), but achieves the optimal balance of user speed and system correctness.

### 4.2 State Management: Zustand + TanStack Query
*   **Choice**: Zustand for client-side session state and conflict queues; TanStack Query for server state caching.
*   **Rationale**: Server state has distinct requirements (caching, automated refetching, garbage collection, and invalidation) which TanStack Query manages natively. Client session state (such as tracking offline status or the list of in-flight optimistic requests) belongs in a global client store like Zustand.
*   **Alternatives considered**:
    *   *Redux ToolKit (RTK)*: Offers structured state management but introduces excessive boilerplate.
    *   *Zustand for everything*: Mixes caching logic with client-side UI states, increasing complexity.
*   **Tradeoffs**: Managing two state managers requires developers to maintain a clear mental model of data ownership, but enforces a clean separation of concerns.

### 4.3 Reconciliation Strategy: Polling vs. WebSockets
*   **Choice**: 30-second polling using TanStack Query.
*   **Rationale**: Time-off balances change relatively infrequently. A 30-second polling interval balances latency and server overhead. WebSockets require stateful connection management and server-side infrastructure, which is unnecessary for this domain.
*   **Alternatives considered**:
    *   *WebSockets*: Rejected due to high implementation complexity and lack of support in standard HCM architectures.
    *   *Manual Refresh Only*: Rejected as it fails to detect background balance updates (like anniversary bonuses) in a timely manner.
*   **Tradeoffs**: Introduces up to 30 seconds of latency for background updates, which is entirely acceptable for employee time-off management.

### 4.4 Reconciliation Conflict Resolution
*   **Choice**: Surface conflicts and require manual user acknowledgment or resolution.
*   **Rationale**: If a background sync returns a different balance while a mutation is in flight, we cannot silently overwrite the cache. Surfacing the conflict via a banner keeps the user informed and prevents data loss.
*   **Alternatives considered**:
    *   *Auto-Resolve (Trust Cache)*: Risks ignoring critical HCM changes.
    *   *Auto-Resolve (Trust HCM)*: Wipes out the user's optimistic progress.
*   **Tradeoffs**: Requires additional UI elements (banners, alerts) but guarantees transparency and data integrity.

---

## §5 Data Layer & State Management

### 5.1 Store Responsibilities
1.  **TanStack Query Cache**:
    *   `['balance', employeeId, locationId]`: Individual balance.
    *   `['balances', employeeId]`: Complete set of location balances.
    *   `['requests', employeeId]`: Time-off history.
    *   `['pending-requests', managerId]`: Manager review queue.
2.  **Zustand Session Store (`useSessionStore`)**:
    *   `isHCMReachable: boolean` (tracks connection status).
    *   `reconciliationRunning: boolean` (indicates active background sync).
    *   `balancesRefreshedAt: number | null` (timestamp of last background update).
3.  **Zustand Optimistic Store (`useOptimisticStore`)**:
    *   `inFlightRequests: OptimisticEntry[]` (active submissions).
    *   `conflicts: ConflictEntry[]` (detected balance conflicts).
    *   `requestStatuses: Record<string, RequestStatus>` (status mapping).

### 5.2 Submission Data Flow
```
[User Clicks Submit]
        |
        v
[useSubmitRequest Mutation Triggered]
        |
        v
[onMutate]:
 1. Generate unique request ID ('opt-xxxx')
 2. Invalidate and cancel active balance queries
 3. Capture previous balance (for rollback)
 4. Calculate new balance: available - requested
 5. Update TanStack Query cache directly with the new balance
 6. Push entry to Zustand `inFlightRequests`
 7. Set status to 'pending-optimistic'
        |
        +-----------------------+-----------------------+
        | (API Success)                                 | (API Failure / Timeout)
        v                                               v
[onSuccess]:                                    [onError]:
 1. Remove from `inFlightRequests`               1. Restore Query cache using previousBalance
 2. Set status to 'pending-hcm'                  2. Remove from `inFlightRequests`
 3. Invalidate balance queries                   3. Set status to 'rolled-back'
 4. Trigger refetch of request list              4. Invalidate balance queries
```

### 5.3 Reconciliation Algorithm
During the 30-second interval, `useReconciliation` performs the following steps:
1.  Fetches all balances from the HCM batch endpoint.
2.  Queries the TanStack Query cache for all active balance keys.
3.  Compares each cached cell value with the fresh HCM value.
4.  If the values differ, check if there is an entry in `inFlightRequests` matching that employee and location.
5.  If an in-flight entry exists:
    *   Create a `ConflictEntry` and push it to the Zustand conflict list.
    *   Do **not** update the cache (preserves the optimistic state).
6.  If no in-flight entry exists:
    *   Update the TanStack Query cache with the new HCM value.
    *   If updates were made, trigger `balancesRefreshedAt` to notify the UI.

---

## §6 Component Tree & Data Flow

```
App
├─ SessionBanner (subscribes to useSessionStore & useOptimisticStore)
├─ EmployeePage
│  ├─ BalanceGrid
│  │  └─ BalanceCell (subscribes to query cache & useOptimisticStore)
│  ├─ RequestForm (subscribes to useBalance & useSubmitRequest)
│  │  └─ BalancePreview
│  └─ RequestHistory
└─ ManagerPage
   ├─ PendingQueue
   └─ RequestReviewCard (subscribes to useApproveRequest & useDenyRequest)
      └─ ConflictWarning
```

### 6.1 Critical Submission Path
1.  **Input**: User selects dates in `RequestForm`.
2.  **Validation**: Form checks `calculateWorkingDays`. If the requested days exceed `balance.available`, submit is disabled.
3.  **Submission**: User submits. `useSubmitRequest` updates the query cache. `BalanceCell` immediately re-renders, displaying the reduced balance and showing a "Pending confirmation" badge.
4.  **Completion**: The HCM confirms. `BalanceCell` hides the badge, and the request appears in `RequestHistory` as `pending` (awaiting manager approval).

---

## §7 Error Handling & Degradation

Our system degrades gracefully under various failure modes:

| Failure Mode | Detection Mechanism | System Action | UI Presentation |
| :--- | :--- | :--- | :--- |
| **Slow HCM Response** | 10-second timeout in `hcm-client.ts` | Aborts fetch; triggers mutation rollback | Displays: "Request could not be confirmed. Please try again." |
| **Insufficient Balance (409)** | Server responds with 409 error | Reverts optimistic cache; updates true balance | Displays: "Your balance is insufficient for these dates. Please adjust." |
| **HCM Offline (500/Network Error)** | Fetch throws connection error | Reverts optimistic cache; marks HCM unreachable | Displays red banner: "HCM is unreachable. Submissions disabled." |
| **Conflict (Mid-flight bonus)** | Reconciliation diff finds discrepancy | Registers conflict in Zustand; blocks balance overwrite | Displays amber banner: "Balance conflict detected. Refresh to reconcile." |
| **Real-time Approval Conflict** | `fetchBalance` pre-check returns low balance | Blocks approve mutation in `useApproveRequest` | Renders `ConflictWarning` banner; disables Approve button |

---

## §8 UI States & Story Matrix

Every state has been fully simulated and verified inside Storybook (located in `src/stories/`):

### 8.1 BalanceCell (`BalanceCell.stories.tsx`)
1.  **Default**: Renders location name, balance, and a verification timestamp.
2.  **Loading**: Renders animated loading skeleton.
3.  **Stale**: Displays an amber warning icon indicating data has exceeded stale threshold.
4.  **Optimistic Pending**: Renders a pulsing blue badge: "Pending confirmation".
5.  **Rolled Back**: Renders a red border and a "Balance restored" label.

### 8.2 RequestForm (`RequestForm.stories.tsx`)
1.  **Default**: Renders calendar inputs, text area, and a disabled submit button.
2.  **Low Balance**: Displays warning helper text if the requested days leave a balance near zero.
3.  **Empty Balance**: Input fields and submit buttons are styled to prevent submission if the balance is zero.

### 8.3 RequestReviewCard (`RequestReviewCard.stories.tsx`)
1.  **Default**: Displays request details. Renders loading skeleton for the balance pre-check.
2.  **Multi-Day**: Simulates a multi-day request with verification badges, displaying active Approve/Deny buttons.

### 8.4 SessionBanner (`SessionBanner.stories.tsx`)
1.  **Default**: Returns null (hidden during normal operation).
2.  **HCM Unreachable**: Displays a prominent red alert banner.
3.  **Conflict Detected**: Displays a yellow alert banner.
4.  **Reconciling**: Displays a subtle progress indicator.

---

## §9 Test Strategy

We implement a comprehensive, multi-layered testing strategy to guarantee robustness:

```
+--------------------------------------------------------------+
|            Storybook Interaction Tests (Playwright)          |
|  - Validates user interaction flows & visual states          |
+--------------------------------------------------------------+
                               |
                               v
+--------------------------------------------------------------+
|             Integration Tests (Vitest + MSW)                 |
|  - Validates optimistic state updates, timeouts, & rollbacks |
+--------------------------------------------------------------+
                               |
                               v
+--------------------------------------------------------------+
|             Unit Tests (Vitest, Logic & Parsing)             |
|  - Validates reconciliation diffs & schema parsing safety    |
+--------------------------------------------------------------+
```

### 9.1 Unit Tests
*   **Target**: Pure utility files (`reconcile.ts` and `schemas.ts`).
*   **Coverage**: Verified all reconciliation outcomes (no changes, updates, and conflicts). Confirmed Zod parsing returns null for incorrect payloads.
*   **Importance**: Protects the core data logic from regressions.

### 9.2 Component Tests
*   **Target**: Component rendering and user interactions using React Testing Library.
*   **Coverage**: Verified that elements (like `RequestReviewCard`) block approval during verification and render correct indicators in response to state changes.

### 9.3 Integration Tests
*   **Target**: End-to-end API workflows mocked via MSW (Mock Service Worker).
*   **Coverage**: Tested submission success, 409 rollback, real-time manager pre-check, and background reconciliation updates.

### 9.4 Storybook Interaction Tests
*   **Target**: Storybook `play` functions using `@storybook/addon-vitest`.
*   **Coverage**: Automated assertions checking that components render correctly under all 27 simulated states.

---

## §10 Key Invariants

1.  **Pessimistic Verification**: Never show the `Approve` button to a manager until the employee's current balance is successfully fetched and verified.
2.  **Terminal State Guarantees**: Every optimistic update must resolve or roll back. No request remains in a pending-optimistic state beyond the 10-second timeout.
3.  **No Silent Overwrites**: Reconciliation must never silently overwrite cached balances when an active mutation is in flight; a conflict must be raised.
4.  **Strict Data Sanitization**: All HCM responses must pass Zod parsing via `safeParseHCM`. Raw JSON is never trusted.
5.  **Centralization**: All timing and retry constants must reside in [constants.ts](file:///c:/Users/bilal/OneDrive/Desktop/coding%20tests/assignment/examplehr-timeoff/src/lib/constants.ts). No magic values are permitted in components.

---

## §11 Tradeoffs & Future Work

### 11.1 Tradeoffs Made
*   **Polling vs. WebSockets**: Polling introduces up to 30 seconds of latency for background changes. This is acceptable for a time-off system and avoids the overhead of managing WebSocket infrastructure.
*   **In-Memory API State**: The mock HCM state is maintained in-memory. It resets on server restart, but provides a reliable, self-contained mock for testing.

### 11.2 Future Work
*   **Offline Mode Persistence**: Persisting optimistic requests to `localStorage` to queue submissions when connectivity is restored.
*   **Request Deduplication**: Introducing client-side request hashing to prevent accidental double-clicks from submitting duplicate requests.

---

## §12 References

*   [src/lib/reconcile.ts](file:///c:/Users/bilal/OneDrive/Desktop/coding%20tests/assignment/examplehr-timeoff/src/lib/reconcile.ts) — Reconciliation Diff Engine.
*   [src/store/optimistic.ts](file:///c:/Users/bilal/OneDrive/Desktop/coding%20tests/assignment/examplehr-timeoff/src/store/optimistic.ts) — Client-side In-flight and Conflict Stores.
*   [src/hooks/useSubmitRequest.ts](file:///c:/Users/bilal/OneDrive/Desktop/coding%20tests/assignment/examplehr-timeoff/src/hooks/useSubmitRequest.ts) — Optimistic Submission & Rollback Lifecycle Hook.
*   [src/components/manager/RequestReviewCard.tsx](file:///c:/Users/bilal/OneDrive/Desktop/coding%20tests/assignment/examplehr-timeoff/src/components/manager/RequestReviewCard.tsx) — Pessimistic Balance Verification & Manager Approval.
*   [vitest.config.ts](file:///c:/Users/bilal/OneDrive/Desktop/coding%20tests/assignment/examplehr-timeoff/vitest.config.ts) — Centralized Vitest & Storybook Test Configuration.
