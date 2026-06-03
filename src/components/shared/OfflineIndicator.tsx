'use client';

import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export default function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateStatus = () => {
      setIsOffline(!window.navigator.onLine);
    };

    updateStatus();
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-zinc-900 text-white px-4 py-3 rounded-lg shadow-lg border border-zinc-800 dark:bg-zinc-950 dark:border-zinc-800 animate-slide-in">
      <WifiOff className="h-5 w-5 text-amber-500 animate-pulse" />
      <span className="text-sm font-medium">You are currently offline</span>
    </div>
  );
}
