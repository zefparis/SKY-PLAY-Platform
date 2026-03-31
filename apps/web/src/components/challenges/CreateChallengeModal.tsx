'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Swords, Trophy, Users, Wallet, Check } from 'lucide-react';
import { formatSKY, computeNetPot, computePrizes } from '@/lib/currency';
import { getAuthToken } from '@/lib/get-auth-token';
import { useI18n } from '@/components/i18n/I18nProvider';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const CHALLENGE_TYPES = [
  { key: 'DUEL', label: '1v1 Duel', maxPlayers: 2, entryFee: 2000, commission: 0.25, color: 'from-blue-600 to-blue-400', icon: '⚔️' },
  { key: 'SMALL_CHALLENGE', label: 'Small Challenge', maxPlayers: 5, entryFee: 2000, commission: 0.20, color: 'from-green-600 to-green-400', icon: '🎯' },
  { key: 'STANDARD', label: 'Standard', maxPlayers: 10, entryFee: 2000, commission: 0.10, color: 'from-purple-600 to-purple-400', icon: '🏆' },
  { key: 'MEDIUM_TOURNAMENT', label: 'Tournoi M', maxPlayers: 20, entryFee: 2000, commission: 0.15, color: 'from-orange-600 to-orange-400', icon: '🎮' },
  { key: 'BIG_TOURNAMENT', label: 'Tournoi L', maxPlayers: 50, entryFee: 2000, commission: 0.10, color: 'from-red-600 to-red-400', icon: '🔥' },
  { key: 'PREMIUM_TOURNAMENT', label: 'Premium', maxPlayers: 100, entryFee: 5000, commission: 0.10, color: 'from-yellow-600 to-yellow-400', icon: '👑' },
];

const GAMES = ['FIFA', 'COD', 'Fortnite', 'PUBG', 'Free Fire', 'Mobile Legends', 'Autre'];

interface CreateChallengeModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateChallengeModal({ onClose, onCreated }: CreateChallengeModalProps) {
  const { t } = useI18n();
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<typeof CHALLENGE_TYPES[0] | null>(null);
  const [title, setTitle] = useState('');
  const [game, setGame] = useState('FIFA');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const netPot = selectedType
    ? computeNetPot(selectedType.entryFee * selectedType.maxPlayers, selectedType.commission)
    : 0;
  const prizes = computePrizes(netPot);

  const handleCreate = async () => {
    if (!selectedType || !title || !game) return;
    setLoading(true);
    setError('');
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Non authentifié. Veuillez vous connecter.');
      }
      const res = await fetch(`${API}/challenges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, game, type: selectedType.key }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erreur lors de la création');
      }
      onCreated();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pb-20 sm:pb-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-2xl dark:bg-[#00165F] bg-white rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[85dvh] sm:max-h-[90vh]"
      >
        {/* Header — fixed */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b dark:border-white/10 border-gray-100 shrink-0">
          <div>
            <h2 className="text-lg sm:text-xl font-black dark:text-white text-[#00165F]">{t('create.title')}</h2>
            <p className="text-xs dark:text-white/50 text-[#00165F]/50 mt-0.5">{t('create.step')} {step}/3</p>
          </div>
          <button onClick={onClose} className="dark:text-white/50 text-[#00165F]/50 hover:text-[#FD2E5F] transition-colors p-1">
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-4 sm:px-6 pt-3 sm:pt-4 shrink-0">
          <div className="flex gap-2">
            {[1, 2, 3].map(s => (
              <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? 'bg-[#0097FC]' : 'dark:bg-white/10 bg-gray-200'}`} />
            ))}
          </div>
        </div>

        {/* Scrollable body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <AnimatePresence mode="wait">
            {/* Step 1 — Type */}
            {step === 1 && (
              <motion.div key="step1" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
                <p className="dark:text-white/70 text-[#00165F]/70 mb-4 text-sm">{t('create.step1.label')}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {CHALLENGE_TYPES.map(type => {
                    const typeNetPot = computeNetPot(type.entryFee * type.maxPlayers, type.commission);
                    const typePrizes = computePrizes(typeNetPot);
                    const isSelected = selectedType?.key === type.key;
                    return (
                      <button
                        key={type.key}
                        onClick={() => setSelectedType(type)}
                        className={`relative p-3 rounded-xl border-2 text-left transition-all ${
                          isSelected
                            ? 'border-[#0097FC] dark:bg-[#0097FC]/10 bg-[#0097FC]/5'
                            : 'border-transparent dark:bg-white/5 bg-gray-50 hover:border-[#0097FC]/50'
                        }`}
                      >
                        {isSelected && (
                          <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#0097FC] flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </span>
                        )}
                        <div className={`text-2xl mb-1`}>{type.icon}</div>
                        <p className="font-bold text-sm dark:text-white text-[#00165F]">{type.label}</p>
                        <p className="text-xs dark:text-white/50 text-[#00165F]/50">{type.maxPlayers} {t('create.maxPlayers')}</p>
                        <p className="text-xs font-semibold text-[#0097FC] mt-1">🪙 {formatSKY(type.entryFee)}</p>
                        <p className="text-xs text-[#FD2E5F]">{t('challenge.card.top1')} {formatSKY(typePrizes.first)}</p>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Step 2 — Details */}
            {step === 2 && selectedType && (
              <motion.div key="step2" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
                <p className="dark:text-white/70 text-[#00165F]/70 mb-4 text-sm">{t('create.step2.label')}</p>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold dark:text-white/70 text-[#00165F]/70 mb-1 block">{t('create.nameLabel')}</label>
                    <input
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder={t('create.namePlaceholder')}
                      maxLength={60}
                      className="w-full px-4 py-2.5 rounded-xl dark:bg-white/10 bg-gray-50 dark:text-white text-[#00165F] border dark:border-white/10 border-gray-200 focus:outline-none focus:border-[#0097FC] text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold dark:text-white/70 text-[#00165F]/70 mb-1 block">{t('create.game')}</label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {GAMES.map(g => (
                        <button
                          key={g}
                          onClick={() => setGame(g)}
                          className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                            game === g ? 'bg-[#0097FC] text-white' : 'dark:bg-white/5 bg-gray-50 dark:text-white/70 text-[#00165F]/70 hover:bg-[#0097FC]/20'
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Financial summary */}
                  <div className="rounded-xl dark:bg-white/5 bg-gray-50 p-4 space-y-2">
                    <p className="text-xs font-semibold dark:text-white/50 text-[#00165F]/50 uppercase tracking-wide">{t('create.step3.label')}</p>
                    <div className="flex justify-between text-sm">
                      <span className="dark:text-white/70 text-[#00165F]/70">{t('create.entryFee')}</span>
                      <span className="font-bold text-[#FD2E5F]">🪙 {formatSKY(selectedType.entryFee)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="dark:text-white/70 text-[#00165F]/70">{t('create.ifFull')} ({selectedType.maxPlayers} {t('challenge.card.players')})</span>
                      <span className="font-bold text-[#0097FC]">🪙 {formatSKY(selectedType.entryFee * selectedType.maxPlayers)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="dark:text-white/70 text-[#00165F]/70">{t('rules.prize1st')}</span>
                      <span className="font-bold text-[#FD2E5F]">🪙 {formatSKY(prizes.first)}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3 — Confirmation */}
            {step === 3 && selectedType && (
              <motion.div key="step3" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
                <p className="dark:text-white/70 text-[#00165F]/70 mb-4 text-sm">{t('create.step3.label')}</p>
                <div className="rounded-xl dark:bg-white/5 bg-gray-50 p-5 space-y-3 mb-4">
                  <div className="flex justify-between">
                    <span className="dark:text-white/60 text-[#00165F]/60 text-sm">{t('create.name')}</span>
                    <span className="dark:text-white text-[#00165F] font-semibold text-sm">{title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="dark:text-white/60 text-[#00165F]/60 text-sm">{t('create.game')}</span>
                    <span className="dark:text-white text-[#00165F] font-semibold text-sm">{game}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="dark:text-white/60 text-[#00165F]/60 text-sm">{t('create.type')}</span>
                    <span className="dark:text-white text-[#00165F] font-semibold text-sm">{selectedType.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="dark:text-white/60 text-[#00165F]/60 text-sm">{t('create.maxPlayersLabel')}</span>
                    <span className="dark:text-white text-[#00165F] font-semibold text-sm">{selectedType.maxPlayers}</span>
                  </div>
                  <div className="h-px dark:bg-white/10 bg-gray-200" />
                  <div className="flex justify-between">
                    <span className="dark:text-white/60 text-[#00165F]/60 text-sm font-semibold">{t('create.entryFee')}</span>
                    <span className="font-black text-[#FD2E5F]">🪙 {formatSKY(selectedType.entryFee)}</span>
                  </div>
                </div>

                <div className="rounded-xl bg-[#0097FC]/10 border border-[#0097FC]/30 p-4 text-center mb-4">
                  <p className="text-sm dark:text-white/70 text-[#00165F]/70 mb-1">{t('create.ifFull')} ({selectedType.maxPlayers} {t('challenge.card.players')})</p>
                  <p className="text-2xl font-black text-[#0097FC]">🪙 {formatSKY(prizes.first)}</p>
                  <p className="text-xs text-[#FD2E5F]">{t('create.top1Prize')}</p>
                </div>

                <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-3 mb-4">
                  <p className="text-xs font-bold text-yellow-400 mb-1">{t('create.refund.title')}</p>
                  <ul className="text-[10px] text-yellow-400/70 space-y-0.5 list-disc list-inside">
                    <li>{t('create.refund.1')}</li>
                    <li>{t('create.refund.2')}</li>
                    <li>{t('create.refund.3')}</li>
                    <li>{t('create.refund.4')}</li>
                  </ul>
                </div>

                {error && (
                  <p className="text-sm text-red-500 bg-red-500/10 rounded-lg px-3 py-2 mb-3">{error}</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer — fixed */}
        <div className="px-4 sm:px-6 py-4 sm:pb-6 flex justify-between gap-3 border-t dark:border-white/10 border-gray-100 shrink-0">
          {step > 1 ? (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-1 px-4 py-2 rounded-xl dark:bg-white/10 bg-gray-100 dark:text-white text-[#00165F] font-medium text-sm hover:opacity-80"
            >
              <ChevronLeft className="w-4 h-4" /> {t('create.back')}
            </button>
          ) : <div />}

          {step < 3 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={step === 1 ? !selectedType : !title || !game}
              className="flex items-center gap-1 px-5 py-2 rounded-xl bg-[#0097FC] text-white font-bold text-sm disabled:opacity-40 hover:bg-[#0097FC]/90"
            >
              {t('create.next')} <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#0097FC] text-white font-bold text-sm disabled:opacity-50 hover:bg-[#0097FC]/90"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Swords className="w-4 h-4" />
              )}
              {t('create.submit')}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
