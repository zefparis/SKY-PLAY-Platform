'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-store';

export default function SessionRestorer() {
  const restoreSession = useAuthStore((s) => s.restoreSession);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  return null;
}
