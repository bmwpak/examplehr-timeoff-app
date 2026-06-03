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
