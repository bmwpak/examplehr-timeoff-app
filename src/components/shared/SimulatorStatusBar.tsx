'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  AlertTriangle,
  Clock,
  WifiOff,
  AlertOctagon,
  RotateCcw,
  Loader2,
  X,
} from 'lucide-react';
import clsx from 'clsx';
import { useSessionStore } from '@/store/session';
import { useOptimisticStore } from '@/store/optimistic';
import { useQueryClient } from '@tanstack/react-query';

interface SimConfig {
  silentFailMode: boolean;
  delayMs: number;
  conflictMode: boolean;
}

const DEFAULT_CONFIG: SimConfig = {
  silentFailMode: false,
  delayMs: 0,
  conflictMode: false,
};

export default function SimulatorStatusBar() {
  const [config, setConfig] = useState<SimConfig | null>(null);
  const [resetting, setResetting] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  
  const queryClient = useQueryClient();
  const setHCMReachable = useSessionStore((s) => s.setHCMReachable);
  const clearAllOptimistic = useOptimisticStore((s) => s.clearAll);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/hcm/simulate/config');
      const data = await res.json();
      if (data.config) setConfig(data.config);
    } catch {
      // silently ignore — if we can't reach config endpoint it's fine
    }
  }, []);

  useEffect(() => {
    fetchConfig();
    // Poll every 10s to stay in sync with changes from the home page
    const interval = setInterval(fetchConfig, 10_000);
    return () => clearInterval(interval);
  }, [fetchConfig]);

  const handleReset = async () => {
    setResetting(true);
    try {
      const res = await fetch('/api/hcm/simulate/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(DEFAULT_CONFIG),
      });
      const data = await res.json();
      if (data.config) setConfig(data.config);
      setDismissed(false);
      
      // Clear client state immediately
      setHCMReachable(true);
      clearAllOptimistic();
      queryClient.invalidateQueries();
    } catch {
      // ignore
    } finally {
      setResetting(false);
    }
  };

  // Nothing active or still loading
  if (!config) return null;

  const activeFailures: { icon: React.ReactNode; label: string; color: string }[] = [];

  if (config.delayMs > 0) {
    activeFailures.push({
      icon: <Clock className="h-3.5 w-3.5" />,
      label: `Latency: ${config.delayMs.toLocaleString()}ms`,
      color: config.delayMs >= 10000
        ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    });
  }

  if (config.silentFailMode) {
    activeFailures.push({
      icon: <WifiOff className="h-3.5 w-3.5" />,
      label: 'Silent Failure',
      color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    });
  }

  if (config.conflictMode) {
    activeFailures.push({
      icon: <AlertOctagon className="h-3.5 w-3.5" />,
      label: 'Conflict Mode',
      color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    });
  }

  // Nothing active — don't render
  if (activeFailures.length === 0) return null;

  // User dismissed it
  if (dismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
      <div className="bg-zinc-900 dark:bg-zinc-950 border-t border-zinc-700 dark:border-zinc-800 shadow-2xl">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
          {/* Left: warning icon + active failures */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 p-1.5 bg-amber-500/20 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
            </div>

            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <span className="text-xs font-bold text-zinc-300 whitespace-nowrap">
                Simulator Active:
              </span>
              {activeFailures.map((f, i) => (
                <span
                  key={i}
                  className={clsx(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap',
                    f.color
                  )}
                >
                  {f.icon}
                  {f.label}
                </span>
              ))}
            </div>
          </div>

          {/* Right: reset + dismiss */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={handleReset}
              disabled={resetting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-zinc-900 hover:bg-zinc-100 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {resetting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RotateCcw className="h-3 w-3" />
              )}
              Reset to Defaults
            </button>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="p-1 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
              aria-label="Dismiss simulator status bar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
