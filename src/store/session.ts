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
