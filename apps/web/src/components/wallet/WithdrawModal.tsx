'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, AlertTriangle } from 'lucide-react';
import { formatCFA } from '@/lib/currency';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function getToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('token') || sessionStorage.getItem('token') || '';
}

interface WithdrawModalProps {
  balance: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function WithdrawModal({ balance, onClose, onSuccess }: WithdrawModalProps) {
  const [amount, setAmount] = useState('');
  const [network, setNetwork] = useState<'MTN' | 'ORANGE'>('MTN');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const amountNum = parseInt(amount, 10) || 0;
  const isValid = amountNum >= 1000 && amountNum <= balance && phone.length === 9 && name.trim().length >= 2;

  const handleSubmit = async () => {
    if (!isValid) return;
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/wallet/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ amount: amountNum, phoneNumber: phone, network, name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur lors du retrait');
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md dark:bg-[#00165F] bg-white rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[95dvh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b dark:border-white/10 border-gray-100 shrink-0">
          <div>
            <h2 className="text-lg font-black dark:text-white text-[#00165F]">Retirer des fonds</h2>
            <p className="text-xs dark:text-white/50 text-[#00165F]/50 mt-0.5">Solde disponible : {formatCFA(balance)}</p>
          </div>
          <button onClick={onClose} className="p-1 dark:text-white/50 text-[#00165F]/50 hover:text-[#FD2E5F] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {/* Montant */}
          <div>
            <label className="text-xs font-semibold dark:text-white/60 text-[#00165F]/60 mb-1.5 block">Montant à retirer (min. 1 000 XAF)</label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="5000"
                min={1000}
                max={balance}
                className="w-full px-4 py-3 pr-14 rounded-xl dark:bg-white/10 bg-gray-50 dark:text-white text-[#00165F] border dark:border-white/10 border-gray-200 focus:outline-none focus:border-[#0097FC] text-sm"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs dark:text-white/40 text-[#00165F]/40 font-medium">XAF</span>
            </div>
            {amountNum > 0 && amountNum > balance && (
              <p className="text-xs text-red-400 mt-1">Solde insuffisant ({formatCFA(balance)} disponible)</p>
            )}
            {amountNum > 0 && amountNum < 1000 && (
              <p className="text-xs text-red-400 mt-1">Minimum 1 000 XAF</p>
            )}
          </div>

          {/* Réseau */}
          <div>
            <label className="text-xs font-semibold dark:text-white/60 text-[#00165F]/60 mb-1.5 block">Réseau Mobile Money</label>
            <div className="grid grid-cols-2 gap-2">
              {(['MTN', 'ORANGE'] as const).map(n => (
                <button
                  key={n}
                  onClick={() => setNetwork(n)}
                  className={`py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                    network === n
                      ? 'bg-[#0097FC] text-white shadow-lg shadow-[#0097FC]/20'
                      : 'dark:bg-white/5 bg-gray-50 dark:text-white/70 text-[#00165F]/70 border dark:border-white/10 border-gray-200'
                  }`}
                >
                  📱 {n === 'MTN' ? 'MTN MoMo' : 'Orange Money'}
                </button>
              ))}
            </div>
          </div>

          {/* Téléphone */}
          <div>
            <label className="text-xs font-semibold dark:text-white/60 text-[#00165F]/60 mb-1.5 block">
              Numéro {network === 'MTN' ? 'MTN' : 'Orange'} (9 chiffres)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
              placeholder="677777777"
              className="w-full px-4 py-2.5 rounded-xl dark:bg-white/10 bg-gray-50 dark:text-white text-[#00165F] border dark:border-white/10 border-gray-200 focus:outline-none focus:border-[#0097FC] text-sm tracking-widest"
            />
          </div>

          {/* Nom */}
          <div>
            <label className="text-xs font-semibold dark:text-white/60 text-[#00165F]/60 mb-1.5 block">Nom complet du bénéficiaire</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Jean Dupont"
              className="w-full px-4 py-2.5 rounded-xl dark:bg-white/10 bg-gray-50 dark:text-white text-[#00165F] border dark:border-white/10 border-gray-200 focus:outline-none focus:border-[#0097FC] text-sm"
            />
          </div>

          {/* Récap */}
          {isValid && !confirmed && (
            <div className="rounded-xl dark:bg-white/5 bg-gray-50 p-4 space-y-2">
              <p className="text-xs font-semibold dark:text-white/50 text-[#00165F]/50 uppercase tracking-wide mb-2">Récapitulatif</p>
              <div className="flex justify-between text-sm">
                <span className="dark:text-white/60 text-[#00165F]/60">Montant</span>
                <span className="font-bold text-[#FD2E5F]">{formatCFA(amountNum)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="dark:text-white/60 text-[#00165F]/60">Réseau</span>
                <span className="font-semibold dark:text-white text-[#00165F]">{network === 'MTN' ? 'MTN Mobile Money' : 'Orange Money'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="dark:text-white/60 text-[#00165F]/60">Vers</span>
                <span className="font-semibold dark:text-white text-[#00165F]">{phone}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="dark:text-white/60 text-[#00165F]/60">Solde après</span>
                <span className="font-semibold dark:text-white text-[#00165F]">{formatCFA(balance - amountNum)}</span>
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="rounded-xl dark:bg-yellow-500/10 bg-yellow-50 border border-yellow-500/20 p-3 flex gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
            <p className="text-xs dark:text-yellow-300 text-yellow-700">
              Les retraits sont traités immédiatement. Vérifiez bien le numéro avant de confirmer.
            </p>
          </div>

          {error && <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-5 py-4 border-t dark:border-white/10 border-gray-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-xl dark:bg-white/10 bg-gray-100 dark:text-white text-[#00165F] text-sm font-medium">
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid || loading}
            className="flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-[#FD2E5F] text-white font-bold text-sm disabled:opacity-40 hover:bg-[#FD2E5F]/90"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? 'Traitement...' : `Retirer ${amountNum >= 1000 ? formatCFA(amountNum) : ''}`}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
