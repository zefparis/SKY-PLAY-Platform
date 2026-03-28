'use client';

import { useState, useEffect, useCallback } from 'react';
import { Wallet, Plus } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { formatCFA } from '@/lib/currency';
import { useAuthStore } from '@/lib/auth-store';
import DepositModal from './DepositModal';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function WalletBalance() {
  const idToken = useAuthStore((s) => s.tokens?.idToken);
  const initialized = useAuthStore((s) => s.initialized);
  const [balance, setBalance] = useState<number | null>(null);
  const [showDeposit, setShowDeposit] = useState(false);
  const [mounted, setMounted] = useState(false);

  const fetchBalance = useCallback(async (token: string) => {
    try {
      const res = await fetch(`${API}/wallet`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const data = await res.json();
      setBalance(data.balance ?? 0);
    } catch {}
  }, []);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!initialized || !idToken) return;
    fetchBalance(idToken);
  }, [initialized, idToken, fetchBalance]);

  useEffect(() => {
    const handleWalletUpdate = (e: CustomEvent) => {
      if (typeof e.detail?.balance === 'number') setBalance(e.detail.balance);
    };
    window.addEventListener('wallet_update' as any, handleWalletUpdate);
    return () => window.removeEventListener('wallet_update' as any, handleWalletUpdate);
  }, []);

  if (!mounted || balance === null) return null;

  return (
    <>
      <button
        onClick={() => setShowDeposit(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl dark:bg-white/5 bg-[#00165F]/5 border dark:border-white/10 border-[#00165F]/10 hover:border-[#0097FC]/50 transition-all group"
        title="Wallet — cliquer pour déposer"
      >
        <Wallet className="w-3.5 h-3.5 text-[#0097FC]" />
        <span className="text-sm font-bold dark:text-white text-[#00165F]">{formatCFA(balance)}</span>
        <Plus className="w-3 h-3 dark:text-white/40 text-[#00165F]/40 group-hover:text-[#0097FC] transition-colors" />
      </button>

      <AnimatePresence>
        {showDeposit && (
          <DepositModal
            onClose={() => setShowDeposit(false)}
            onSuccess={() => idToken && fetchBalance(idToken)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
