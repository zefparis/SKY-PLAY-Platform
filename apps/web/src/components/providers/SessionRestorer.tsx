'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-store';

function getTokenTtlSeconds(idToken: string): number {
  try {
    const payload = JSON.parse(atob(idToken.split('.')[1]))
    return (payload.exp as number) - Math.floor(Date.now() / 1000)
  } catch {
    return 0
  }
}

export default function SessionRestorer() {
  const restoreSession = useAuthStore((s) => s.restoreSession);

  // Initial restore on mount
  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // Proactive refresh: every 50 min OR when tab becomes visible and token < 5 min remaining
  useEffect(() => {
    const INTERVAL_MS = 50 * 60 * 1000; // 50 minutes

    const interval = setInterval(() => {
      const t = useAuthStore.getState().tokens;
      if (t?.idToken) restoreSession();
    }, INTERVAL_MS);

    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') return;
      const t = useAuthStore.getState().tokens;
      if (!t?.idToken) return;
      const ttl = getTokenTtlSeconds(t.idToken);
      if (ttl < 5 * 60) restoreSession();
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [restoreSession]);

  return null;
}
