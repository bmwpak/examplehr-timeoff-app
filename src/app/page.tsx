'use client';

import React, { useEffect, useState } from 'react';
import { User, ClipboardList, Settings, Sliders, WifiOff, Clock, AlertOctagon, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import clsx from 'clsx';

interface SimulatorConfig {
  silentFailMode: boolean;
  delayMs: number;
  conflictMode: boolean;
}

export default function LandingPage() {
  const [config, setConfig] = useState<SimulatorConfig>({
    silentFailMode: false,
    delayMs: 0,
    conflictMode: false,
  });
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [bonusEmployee, setBonusEmployee] = useState('emp-001');
  const [bonusLocation, setBonusLocation] = useState('LOC-NY');
  const [bonusDays, setBonusDays] = useState(5);
  const [anniversaryStatus, setAnniversaryStatus] = useState<string | null>(null);
  const [anniversaryLoading, setAnniversaryLoading] = useState(false);

  // Fetch initial simulator config
  useEffect(() => {
    fetch('/api/hcm/simulate/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.config) setConfig(data.config);
      })
      .catch((e) => console.error('Failed to load config', e))
      .finally(() => setLoadingConfig(false));
  }, []);

  const handleSaveConfig = async (updatedFields: Partial<SimulatorConfig>) => {
    setSavingConfig(true);
    const newConfig = { ...config, ...updatedFields };
    try {
      const res = await fetch('/api/hcm/simulate/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });
      const data = await res.json();
      if (data.config) setConfig(data.config);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingConfig(false);
    }
  };

  const triggerAnniversaryBonus = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnniversaryLoading(true);
    setAnniversaryStatus(null);
    try {
      const res = await fetch('/api/hcm/simulate/anniversary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: bonusEmployee,
          locationId: bonusLocation,
          bonusDays,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setAnniversaryStatus(data.message || 'Bonus applied successfully!');
      } else {
        setAnniversaryStatus(`Error: ${data.error || 'Failed'}`);
      }
    } catch {
      setAnniversaryStatus('Network error trigger bonus');
    } finally {
      setAnniversaryLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      {/* Hero section */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
          <Sparkles className="h-3.5 w-3.5 text-zinc-500" />
          Production-Grade Time-Off System
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
          ExampleHR <span className="text-zinc-500 font-medium">Time-Off</span>
        </h1>
        <p className="max-w-xl mx-auto text-base text-zinc-500 dark:text-zinc-400">
          A high-reliability frontend simulating asynchronous HCM integrations, optimistic updates, and background reconciliation.
        </p>
      </div>

      {/* Role Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Employee Card */}
        <a
          href="/employee"
          className="group block p-6 border border-zinc-200 rounded-2xl bg-white shadow-sm hover:shadow-md hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 transition-all duration-300 relative overflow-hidden"
        >
          <div className="absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-zinc-50 dark:bg-zinc-850 group-hover:scale-110 transition-transform duration-300" />
          <div className="relative space-y-4">
            <div className="p-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 w-fit rounded-xl">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                Employee Dashboard
                <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-zinc-500" />
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                View balances, submit time-off requests with instant optimistic updates, and check status history.
              </p>
            </div>
            <div className="text-xs font-semibold text-zinc-450 dark:text-zinc-500">
              Acting as: Alice Chen (emp-001)
            </div>
          </div>
        </a>

        {/* Manager Card */}
        <a
          href="/manager"
          className="group block p-6 border border-zinc-200 rounded-2xl bg-white shadow-sm hover:shadow-md hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 transition-all duration-300 relative overflow-hidden"
        >
          <div className="absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-zinc-50 dark:bg-zinc-850 group-hover:scale-110 transition-transform duration-300" />
          <div className="relative space-y-4">
            <div className="p-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 w-fit rounded-xl">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                Manager Dashboard
                <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-zinc-500" />
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Review request queues with real-time balance checks, pessimistic double-validation, and conflict resolution warnings.
              </p>
            </div>
            <div className="text-xs font-semibold text-zinc-450 dark:text-zinc-500">
              Acting as: Carol Wu (mgr-001)
            </div>
          </div>
        </a>
      </div>

      {/* Simulator Control Panel */}
      <div className="border border-zinc-200 rounded-2xl bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
        <div className="border-b border-zinc-200 px-6 py-4 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/50 flex items-center justify-between">
          <h2 className="text-md font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
            <Settings className="h-5 w-5 text-zinc-500" />
            HCM Simulator Control Panel
          </h2>
          {savingConfig && (
            <span className="text-xs flex items-center gap-1 text-zinc-500">
              <Loader2 className="h-3 w-3 animate-spin" /> Saving...
            </span>
          )}
        </div>

        {loadingConfig ? (
          <div className="p-6 text-center text-sm text-zinc-500">Loading simulator configuration...</div>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Server Settings */}
            <div className="space-y-6">
              <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5" />
                Network & Server Latency
              </h3>

              {/* Server Delay */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <label htmlFor="delayMs" className="font-semibold text-zinc-700 dark:text-zinc-350 flex items-center gap-1.5">
                    <Clock className="h-4.5 w-4.5 text-zinc-400" />
                    HCM Latency Delay (ms)
                  </label>
                  <span className="font-mono bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded text-xs dark:bg-zinc-800 dark:text-zinc-300">
                    {config.delayMs} ms
                  </span>
                </div>
                <input
                  id="delayMs"
                  type="range"
                  min="0"
                  max="15000"
                  step="500"
                  value={config.delayMs}
                  onChange={(e) => handleSaveConfig({ delayMs: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-750 accent-zinc-800 dark:accent-white"
                />
                <p className="text-xs text-zinc-500">
                  Simulates HTTP network delay. Set &gt; 10,000ms to test silent client rollbacks.
                </p>
              </div>

              {/* Silent Failure Toggle */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <label htmlFor="silentFail" className="text-sm font-semibold text-zinc-700 dark:text-zinc-350 flex items-center gap-1.5">
                    <WifiOff className="h-4.5 w-4.5 text-zinc-400" />
                    Silent Failure Mode
                  </label>
                  <p className="text-xs text-zinc-500">
                    Simulates silent network disconnects (HTTP 200 with empty responses) to test UI recovery.
                  </p>
                </div>
                <button
                  id="silentFail"
                  type="button"
                  onClick={() => handleSaveConfig({ silentFailMode: !config.silentFailMode })}
                  className={clsx(
                    'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                    config.silentFailMode ? 'bg-zinc-950 dark:bg-white' : 'bg-zinc-200 dark:bg-zinc-800'
                  )}
                >
                  <span
                    className={clsx(
                      'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-zinc-950 shadow ring-0 transition duration-200 ease-in-out',
                      config.silentFailMode ? 'translate-x-5' : 'translate-x-0'
                    )}
                  />
                </button>
              </div>

              {/* Conflict Mode Toggle */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <label htmlFor="conflictMode" className="text-sm font-semibold text-zinc-700 dark:text-zinc-350 flex items-center gap-1.5">
                    <AlertOctagon className="h-4.5 w-4.5 text-zinc-400" />
                    HCM Inconsistency (Conflict Mode)
                  </label>
                  <p className="text-xs text-zinc-500">
                    Returns success but does NOT deduct balance. Used to trigger background reconciliation conflicts.
                  </p>
                </div>
                <button
                  id="conflictMode"
                  type="button"
                  onClick={() => handleSaveConfig({ conflictMode: !config.conflictMode })}
                  className={clsx(
                    'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                    config.conflictMode ? 'bg-zinc-950 dark:bg-white' : 'bg-zinc-200 dark:bg-zinc-800'
                  )}
                >
                  <span
                    className={clsx(
                      'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-zinc-950 shadow ring-0 transition duration-200 ease-in-out',
                      config.conflictMode ? 'translate-x-5' : 'translate-x-0'
                    )}
                  />
                </button>
              </div>
            </div>

            {/* Anniversary Simulator */}
            <div className="space-y-6">
              <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Simulate Anniversary Event
              </h3>

              <form onSubmit={triggerAnniversaryBonus} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label htmlFor="bonusEmployee" className="text-xs font-semibold text-zinc-550 dark:text-zinc-400">Employee</label>
                    <select
                      id="bonusEmployee"
                      value={bonusEmployee}
                      onChange={(e) => setBonusEmployee(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-zinc-300 rounded-lg dark:border-zinc-700 dark:bg-zinc-850 dark:text-white"
                    >
                      <option value="emp-001">Alice Chen (emp-001)</option>
                      <option value="emp-002">Bob Patel (emp-002)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="bonusLocation" className="text-xs font-semibold text-zinc-550 dark:text-zinc-400">Location</label>
                    <select
                      id="bonusLocation"
                      value={bonusLocation}
                      onChange={(e) => setBonusLocation(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-zinc-300 rounded-lg dark:border-zinc-700 dark:bg-zinc-850 dark:text-white"
                    >
                      <option value="LOC-NY">New York (LOC-NY)</option>
                      {bonusEmployee === 'emp-001' && (
                        <option value="LOC-SF">San Francisco (LOC-SF)</option>
                      )}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="bonusDays" className="text-xs font-semibold text-zinc-550 dark:text-zinc-400">Bonus Days to Grant</label>
                  <input
                    id="bonusDays"
                    type="number"
                    min="1"
                    max="10"
                    value={bonusDays}
                    onChange={(e) => setBonusDays(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-1.5 text-xs border border-zinc-300 rounded-lg dark:border-zinc-700 dark:bg-zinc-850 dark:text-white"
                    required
                  />
                  <p className="text-[10px] text-zinc-500">
                    Granting bonus days on server triggers a discrepancy that background reconciliation will silently correct.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={anniversaryLoading}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-900 text-white rounded-lg text-xs font-semibold hover:bg-zinc-800 disabled:bg-zinc-300 disabled:text-zinc-500 dark:bg-white dark:text-black dark:hover:bg-zinc-150 transition-colors cursor-pointer"
                >
                  {anniversaryLoading ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" /> Granting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 animate-pulse" />
                      Grant Bonus Days
                    </>
                  )}
                </button>

                {anniversaryStatus && (
                  <div className="p-2.5 rounded-lg border text-[11px] font-semibold text-zinc-700 bg-zinc-50 dark:border-zinc-850 dark:bg-zinc-850 dark:text-zinc-300">
                    {anniversaryStatus}
                  </div>
                )}
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
