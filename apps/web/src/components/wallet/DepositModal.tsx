'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Smartphone, CreditCard, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { formatCFA } from '@/lib/currency';
import { useAuthStore } from '@/lib/auth-store';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const QUICK_AMOUNTS = [1000, 2000, 5000, 10000, 20000, 50000];
const POLL_INTERVAL = 3000;
const POLL_MAX = 40;

type PayMethod = 'MTN' | 'ORANGE' | 'CARD';

interface DepositModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function DepositModal({ onClose, onSuccess }: DepositModalProps) {
  const idToken = useAuthStore((s) => s.tokens?.idToken ?? '');
  const user = useAuthStore((s) => s.user);
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState(5000);
  const [customAmount, setCustomAmount] = useState('');
  const [method, setMethod] = useState<PayMethod>('MTN');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pollStatus, setPollStatus] = useState<'idle' | 'polling' | 'success' | 'failed' | 'timeout'>('idle');
  const [transactionId, setTransactionId] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCount = useRef(0);

  const finalAmount = customAmount ? parseInt(customAmount, 10) : amount;
  const email = user?.email || 'user@skyplay.cm';
  const name = user?.username || user?.firstName || 'SKY PLAY User';

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const stopPolling = () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };

  const startPolling = (txId: string) => {
    pollCount.current = 0;
    setPollStatus('polling');
    pollRef.current = setInterval(async () => {
      pollCount.current += 1;
      if (pollCount.current > POLL_MAX) {
        stopPolling();
        setPollStatus('timeout');
        return;
      }
      try {
        const res = await fetch(`${API}/wallet/transactions?limit=20`, {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const tx = data.transactions?.find((t: any) => t.id === txId);
        if (tx?.status === 'COMPLETED') {
          stopPolling();
          setPollStatus('success');
          setTimeout(() => { onSuccess(); onClose(); }, 1500);
        } else if (tx?.status === 'FAILED') {
          stopPolling();
          setPollStatus('failed');
        }
      } catch {}
    }, POLL_INTERVAL);
  };

  const handleSubmit = async () => {
    if (finalAmount < 500) { setError('Montant minimum : 500 CFA'); return; }
    if ((method === 'MTN' || method === 'ORANGE') && !phone) { setError('Numéro de téléphone requis'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/wallet/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ amount: finalAmount, paymentMethod: method, phoneNumber: phone || undefined, email, name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur');

      if (method === 'CARD' && data.paymentLink) {
        window.location.href = data.paymentLink;
        return;
      }
      setTransactionId(data.transactionId);
      setStep(3);
      startPolling(data.transactionId);
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
            <h2 className="text-lg font-black dark:text-white text-[#00165F]">Déposer des fonds</h2>
            <p className="text-xs dark:text-white/50 text-[#00165F]/50 mt-0.5">
              {step === 1 ? 'Choisir le montant' : step === 2 ? 'Méthode de paiement' : 'En attente de paiement'}
            </p>
          </div>
          <button onClick={onClose} className="p-1 dark:text-white/50 text-[#00165F]/50 hover:text-[#FD2E5F] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress */}
        {step < 3 && (
          <div className="px-4 sm:px-5 pt-3 shrink-0">
            <div className="flex gap-1.5">
              {[1, 2].map(s => (
                <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? 'bg-[#0097FC]' : 'dark:bg-white/10 bg-gray-200'}`} />
              ))}
            </div>
          </div>
        )}

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1">
          <AnimatePresence mode="wait">

            {/* Step 1 — Montant */}
            {step === 1 && (
              <motion.div key="s1" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-4">
                <div>
                  <p className="text-xs font-semibold dark:text-white/50 text-[#00165F]/50 uppercase tracking-wide mb-2">Montants rapides</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {QUICK_AMOUNTS.map(a => (
                      <button
                        key={a}
                        onClick={() => { setAmount(a); setCustomAmount(''); }}
                        className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                          amount === a && !customAmount
                            ? 'bg-[#0097FC] text-white shadow-lg shadow-[#0097FC]/30'
                            : 'dark:bg-white/5 bg-gray-50 dark:text-white text-[#00165F] hover:border-[#0097FC]/50 border border-transparent'
                        }`}
                      >
                        {formatCFA(a)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold dark:text-white/50 text-[#00165F]/50 uppercase tracking-wide mb-2">Montant personnalisé</p>
                  <div className="relative">
                    <input
                      type="number"
                      value={customAmount}
                      onChange={e => setCustomAmount(e.target.value)}
                      placeholder="Ex : 7500"
                      min={500}
                      className="w-full px-4 py-3 pr-14 rounded-xl dark:bg-white/10 bg-gray-50 dark:text-white text-[#00165F] border dark:border-white/10 border-gray-200 focus:outline-none focus:border-[#0097FC] text-sm"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs dark:text-white/40 text-[#00165F]/40 font-medium">XAF</span>
                  </div>
                  <p className="text-xs dark:text-white/30 text-[#00165F]/30 mt-1">Minimum : 500 XAF</p>
                </div>
                {finalAmount >= 500 && (
                  <div className="rounded-xl bg-[#0097FC]/10 border border-[#0097FC]/20 px-4 py-3 text-center">
                    <p className="text-2xl font-black text-[#0097FC]">{formatCFA(finalAmount)}</p>
                    <p className="text-xs dark:text-white/50 text-[#00165F]/50 mt-0.5">seront crédités sur votre wallet</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 2 — Méthode */}
            {step === 2 && (
              <motion.div key="s2" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-3">
                {/* MTN */}
                <button
                  onClick={() => setMethod('MTN')}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${method === 'MTN' ? 'border-[#0097FC] dark:bg-[#0097FC]/10 bg-[#0097FC]/5' : 'border-transparent dark:bg-white/5 bg-gray-50'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📱</span>
                    <div>
                      <p className="font-bold text-sm dark:text-white text-[#00165F]">MTN Mobile Money</p>
                      <p className="text-xs dark:text-white/50 text-[#00165F]/50">Numéro 67x / 65x / 68x</p>
                    </div>
                  </div>
                </button>

                {/* Orange */}
                <button
                  onClick={() => setMethod('ORANGE')}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${method === 'ORANGE' ? 'border-[#0097FC] dark:bg-[#0097FC]/10 bg-[#0097FC]/5' : 'border-transparent dark:bg-white/5 bg-gray-50'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📱</span>
                    <div>
                      <p className="font-bold text-sm dark:text-white text-[#00165F]">Orange Money</p>
                      <p className="text-xs dark:text-white/50 text-[#00165F]/50">Numéro 69x / 655 / 657</p>
                    </div>
                  </div>
                </button>

                {/* Carte */}
                <button
                  onClick={() => setMethod('CARD')}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${method === 'CARD' ? 'border-[#0097FC] dark:bg-[#0097FC]/10 bg-[#0097FC]/5' : 'border-transparent dark:bg-white/5 bg-gray-50'}`}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-6 h-6 text-[#0097FC]" />
                    <div>
                      <p className="font-bold text-sm dark:text-white text-[#00165F]">Carte Visa / Mastercard</p>
                      <p className="text-xs dark:text-white/50 text-[#00165F]/50">Paiement sécurisé Flutterwave</p>
                    </div>
                  </div>
                </button>

                {/* Téléphone pour MoMo */}
                {(method === 'MTN' || method === 'ORANGE') && (
                  <div>
                    <label className="text-xs font-semibold dark:text-white/60 text-[#00165F]/60 mb-1.5 block">
                      Numéro {method === 'MTN' ? 'MTN' : 'Orange'} (format CM : 6XXXXXXXX)
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                      placeholder="677777777"
                      className="w-full px-4 py-2.5 rounded-xl dark:bg-white/10 bg-gray-50 dark:text-white text-[#00165F] border dark:border-white/10 border-gray-200 focus:outline-none focus:border-[#0097FC] text-sm tracking-widest"
                    />
                  </div>
                )}

                {error && <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>}

                {/* Récap */}
                <div className="rounded-xl dark:bg-white/5 bg-gray-50 p-3 flex justify-between items-center">
                  <span className="text-sm dark:text-white/60 text-[#00165F]/60">Montant à déposer</span>
                  <span className="font-black text-[#0097FC]">{formatCFA(finalAmount)}</span>
                </div>
              </motion.div>
            )}

            {/* Step 3 — Polling */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-6">
                {pollStatus === 'polling' && (
                  <>
                    <Loader2 className="w-12 h-12 text-[#0097FC] animate-spin mx-auto mb-4" />
                    <p className="font-bold dark:text-white text-[#00165F] text-lg">En attente de confirmation</p>
                    <p className="text-sm dark:text-white/60 text-[#00165F]/60 mt-2">
                      {method === 'MTN' ? 'Validez le paiement MTN sur votre téléphone 📱' : 'Validez le paiement Orange Money 📱'}
                    </p>
                    <div className="mt-4 rounded-xl dark:bg-white/5 bg-gray-50 p-3 text-xs dark:text-white/40 text-[#00165F]/40 space-y-1">
                      <p>Numéro test MTN (succès) : <strong className="dark:text-white text-[#00165F]">677777777</strong></p>
                      <p>Numéro test Orange (succès) : <strong className="dark:text-white text-[#00165F]">695959595</strong></p>
                    </div>
                  </>
                )}
                {pollStatus === 'success' && (
                  <>
                    <CheckCircle className="w-14 h-14 text-green-400 mx-auto mb-4" />
                    <p className="font-black dark:text-white text-[#00165F] text-xl">Dépôt confirmé ! 🎉</p>
                    <p className="text-sm dark:text-white/60 text-[#00165F]/60 mt-2">{formatCFA(finalAmount)} crédités sur votre wallet</p>
                  </>
                )}
                {pollStatus === 'failed' && (
                  <>
                    <XCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
                    <p className="font-bold dark:text-white text-[#00165F] text-lg">Paiement échoué</p>
                    <p className="text-sm dark:text-white/50 text-[#00165F]/50 mt-2">Vérifie le solde de ton compte Mobile Money</p>
                    <button onClick={() => { stopPolling(); setStep(2); setPollStatus('idle'); }} className="mt-4 px-5 py-2 rounded-xl bg-[#0097FC]/20 text-[#0097FC] font-semibold text-sm">
                      Réessayer
                    </button>
                  </>
                )}
                {pollStatus === 'timeout' && (
                  <>
                    <XCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                    <p className="font-bold dark:text-white text-[#00165F]">Délai dépassé</p>
                    <p className="text-sm dark:text-white/50 text-[#00165F]/50 mt-2">Le paiement n'a pas été confirmé dans les temps. Vérifie ton historique plus tard.</p>
                    <button onClick={onClose} className="mt-4 px-5 py-2 rounded-xl dark:bg-white/10 bg-gray-100 dark:text-white text-[#00165F] font-semibold text-sm">
                      Fermer
                    </button>
                  </>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer */}
        {step < 3 && (
          <div className="px-4 sm:px-5 py-4 border-t dark:border-white/10 border-gray-100 flex justify-between gap-3 shrink-0">
            {step > 1 ? (
              <button
                onClick={() => { setStep(s => s - 1); setError(''); }}
                className="flex items-center gap-1 px-4 py-2 rounded-xl dark:bg-white/10 bg-gray-100 dark:text-white text-[#00165F] font-medium text-sm hover:opacity-80"
              >
                <ChevronLeft className="w-4 h-4" /> Retour
              </button>
            ) : <div />}

            {step === 1 ? (
              <button
                onClick={() => { if (finalAmount < 500) { setError('Montant minimum : 500 XAF'); return; } setError(''); setStep(2); }}
                disabled={finalAmount < 500}
                className="flex items-center gap-1 px-5 py-2 rounded-xl bg-[#0097FC] text-white font-bold text-sm disabled:opacity-40 hover:bg-[#0097FC]/90"
              >
                Suivant <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading || ((method === 'MTN' || method === 'ORANGE') && !phone)}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#0097FC] text-white font-bold text-sm disabled:opacity-40 hover:bg-[#0097FC]/90"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {method === 'CARD' ? 'Payer par carte' : 'Confirmer le dépôt'}
              </button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
