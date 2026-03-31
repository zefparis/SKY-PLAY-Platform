'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Clock, AlertTriangle, CheckCircle, XCircle, Pause } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type Duration = '24H' | '72H' | '1_WEEK' | '1_MONTH' | '3_MONTHS' | 'PERMANENT';

const DURATIONS: { value: Duration; label: string; type: 'pause' | 'exclusion'; warning?: boolean }[] = [
  { value: '24H',      label: '24 heures',           type: 'pause' },
  { value: '72H',      label: '72 heures',           type: 'pause' },
  { value: '1_WEEK',   label: '1 semaine',           type: 'exclusion' },
  { value: '1_MONTH',  label: '1 mois',              type: 'exclusion' },
  { value: '3_MONTHS', label: '3 mois',              type: 'exclusion' },
  { value: 'PERMANENT', label: 'Exclusion définitive ⚠️', type: 'exclusion', warning: true },
];

const DURATION_LABELS: Record<Duration, string> = {
  '24H': '24 heures',
  '72H': '72 heures',
  '1_WEEK': '1 semaine',
  '1_MONTH': '1 mois',
  '3_MONTHS': '3 mois',
  'PERMANENT': 'définitivement',
};

function calcEndDate(duration: Duration): Date | null {
  const ms: Record<string, number> = {
    '24H': 24*3600*1000, '72H': 72*3600*1000,
    '1_WEEK': 7*24*3600*1000, '1_MONTH': 30*24*3600*1000,
    '3_MONTHS': 90*24*3600*1000,
  };
  if (duration === 'PERMANENT') return null;
  return new Date(Date.now() + ms[duration]);
}

export default function ResponsabilitePage() {
  const router = useRouter();
  const idToken = useAuthStore((s) => s.tokens?.idToken ?? '');
  const logout = useAuthStore((s) => s.logout);
  const [selected, setSelected] = useState<Duration | null>(null);
  const [reason, setReason] = useState('');
  const [modal, setModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStatus, setCurrentStatus] = useState<any>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    if (!idToken) return;
    fetch(`${API}/users/self-exclude/status`, { headers: { Authorization: `Bearer ${idToken}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setCurrentStatus(data); })
      .catch(() => {})
      .finally(() => setStatusLoading(false));
  }, [idToken]);

  const isIrrevocable = selected && selected !== '24H' && selected !== '72H';
  const isPause = selected === '24H' || selected === '72H';
  const endDate = selected ? calcEndDate(selected) : null;
  const canSubmit = isPause ? !!selected : (!!selected && confirmText === 'CONFIRMER');

  const handleSubmit = async () => {
    if (!selected || !canSubmit) return;
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/users/self-exclude`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ duration: selected, reason: reason.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur');
      setModal(false);
      logout?.();
      router.push('/compte-suspendu');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setCancelLoading(true);
    try {
      const res = await fetch(`${API}/users/self-exclude/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setCurrentStatus({ exclusionStatus: 'ACTIVE', exclusionUntil: null });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCancelLoading(false);
    }
  };

  if (statusLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0097FC]/30 border-t-[#0097FC] rounded-full animate-spin" />
      </div>
    );
  }

  const isExcluded = currentStatus?.exclusionStatus === 'SELF_EXCLUDED' || currentStatus?.exclusionStatus === 'PERMANENTLY_EXCLUDED';
  const isCooling = currentStatus?.exclusionStatus === 'COOLING_OFF';

  return (
    <div className="min-h-screen pb-12">
      <div className="max-w-lg mx-auto px-4 pt-8">

        {/* Header */}
        <div className="flex items-start gap-3 mb-6">
          <div className="h-12 w-12 shrink-0 rounded-xl bg-gradient-to-br from-[#0097FC] to-[#00165F] flex items-center justify-center">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black dark:text-white text-[#00165F]">Jouer Responsablement</h1>
            <p className="text-sm dark:text-white/60 text-[#00165F]/60">Pause et auto-exclusion</p>
          </div>
        </div>

        {/* Statut actuel si exclu */}
        {(isCooling || isExcluded) && (
          <div className={`rounded-2xl p-5 mb-6 border ${
            isExcluded ? 'bg-red-400/5 border-red-400/30' : 'bg-orange-400/5 border-orange-400/30'
          }`}>
            <div className="flex items-center gap-3 mb-3">
              {isExcluded
                ? <XCircle className="w-6 h-6 text-red-400 shrink-0" />
                : <Pause className="w-6 h-6 text-orange-400 shrink-0" />}
              <div>
                <p className={`font-bold text-sm ${isExcluded ? 'text-red-400' : 'text-orange-400'}`}>
                  {isCooling ? '⏸️ Pause active' : '🔒 Compte suspendu'}
                </p>
                {currentStatus?.exclusionUntil && (
                  <p className="text-xs dark:text-white/60 text-[#00165F]/60">
                    Jusqu'au {new Date(currentStatus.exclusionUntil).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            </div>
            {isCooling && (
              <button
                onClick={handleCancel}
                disabled={cancelLoading}
                className="w-full py-2.5 rounded-xl bg-orange-400/20 text-orange-400 border border-orange-400/30 text-sm font-bold hover:bg-orange-400/30 transition disabled:opacity-50"
              >
                {cancelLoading ? 'Annulation...' : 'Annuler la pause'}
              </button>
            )}
            {isExcluded && (
              <p className="text-xs dark:text-white/50 text-[#00165F]/50">
                Cette suspension est irrévocable. Pour toute erreur : support@skyplay.cm
              </p>
            )}
            {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
          </div>
        )}

        {/* Formulaire */}
        {!isExcluded && (
          <div className="rounded-2xl dark:bg-[#001040] bg-white border dark:border-white/10 border-gray-200 shadow-xl overflow-hidden">
            <div className="p-5 space-y-5">

              {/* Pauses */}
              <div>
                <p className="text-xs font-bold dark:text-white/50 text-[#00165F]/50 uppercase tracking-wider mb-3">
                  ⏸️ Prendre une pause
                </p>
                <div className="space-y-2">
                  {DURATIONS.filter(d => d.type === 'pause').map(d => (
                    <button
                      key={d.value}
                      onClick={() => setSelected(d.value)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition text-left ${
                        selected === d.value
                          ? 'border-[#0097FC] bg-[#0097FC]/10 dark:text-white text-[#00165F]'
                          : 'dark:border-white/10 border-gray-200 dark:text-white/70 text-[#00165F]/70 hover:border-[#0097FC]/30'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                        selected === d.value ? 'border-[#0097FC]' : 'dark:border-white/30 border-gray-300'
                      }`}>
                        {selected === d.value && <div className="w-2 h-2 rounded-full bg-[#0097FC]" />}
                      </div>
                      <span className="text-sm font-semibold">{d.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px dark:bg-white/10 bg-gray-100" />

              {/* Auto-exclusions */}
              <div>
                <p className="text-xs font-bold dark:text-white/50 text-[#00165F]/50 uppercase tracking-wider mb-3">
                  🔒 Auto-exclusion (irrévocable)
                </p>
                <div className="space-y-2">
                  {DURATIONS.filter(d => d.type === 'exclusion').map(d => (
                    <button
                      key={d.value}
                      onClick={() => setSelected(d.value)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition text-left ${
                        selected === d.value
                          ? d.warning
                            ? 'border-red-400 bg-red-400/10 text-red-400'
                            : 'border-[#FD2E5F] bg-[#FD2E5F]/10 dark:text-white text-[#00165F]'
                          : 'dark:border-white/10 border-gray-200 dark:text-white/70 text-[#00165F]/70 hover:border-red-400/30'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                        selected === d.value
                          ? d.warning ? 'border-red-400' : 'border-[#FD2E5F]'
                          : 'dark:border-white/30 border-gray-300'
                      }`}>
                        {selected === d.value && <div className={`w-2 h-2 rounded-full ${d.warning ? 'bg-red-400' : 'bg-[#FD2E5F]'}`} />}
                      </div>
                      <span className="text-sm font-semibold">{d.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Warning irrévocable */}
              {isIrrevocable && (
                <div className="flex items-start gap-2.5 rounded-xl bg-red-400/5 border border-red-400/20 p-3">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-400">
                    Les auto-exclusions de <strong>1 semaine ou plus sont IRRÉVOCABLES</strong>. Aucune annulation n'est possible.
                  </p>
                </div>
              )}

              {/* Raison */}
              <div>
                <label className="text-xs font-semibold dark:text-white/50 text-[#00165F]/50 mb-1.5 block">
                  Raison (optionnel)
                </label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Jeu compulsif, besoin de repos..."
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-[#00165F] text-sm resize-none focus:outline-none focus:border-[#0097FC]"
                />
              </div>

              <button
                onClick={() => selected && setModal(true)}
                disabled={!selected}
                className="w-full py-3 rounded-xl font-bold text-sm transition disabled:opacity-40 disabled:cursor-not-allowed bg-[#FD2E5F] text-white hover:bg-[#FD2E5F]/90"
              >
                {selected
                  ? isPause ? `Prendre une pause de ${DURATION_LABELS[selected]}` : `Confirmer l'auto-exclusion`
                  : 'Sélectionnez une durée'}
              </button>
            </div>
          </div>
        )}

        {/* Info légale */}
        <p className="text-[10px] dark:text-white/30 text-[#00165F]/30 text-center mt-4">
          En cas de difficulté avec le jeu, contactez <a href="mailto:support@skyplay.cm" className="underline">support@skyplay.cm</a>
        </p>
      </div>

      {/* Modal de confirmation */}
      {modal && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl dark:bg-[#001040] bg-white border dark:border-white/10 border-gray-200 shadow-2xl p-6 space-y-4">

            <div className="flex items-center gap-3">
              <AlertTriangle className={`w-6 h-6 shrink-0 ${isIrrevocable ? 'text-red-400' : 'text-orange-400'}`} />
              <h2 className="text-lg font-black dark:text-white text-[#00165F]">
                {isPause ? 'Confirmer la pause' : '⚠️ Action irrévocable'}
              </h2>
            </div>

            {isPause ? (
              <p className="text-sm dark:text-white/70 text-[#00165F]/70">
                Votre compte sera suspendu pendant <strong>{DURATION_LABELS[selected]}</strong>. Vous pouvez annuler cette pause dans les paramètres.
              </p>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl bg-red-400/5 border border-red-400/20 p-3">
                  <p className="text-sm font-bold text-red-400 mb-1">⚠️ ATTENTION — Action IRRÉVOCABLE</p>
                  <p className="text-xs dark:text-white/60 text-[#00165F]/60">
                    Votre compte sera suspendu {selected === 'PERMANENT' ? 'définitivement' : `jusqu'au ${endDate?.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`}.
                    Vous <strong>ne pourrez PAS</strong> annuler cette décision.
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold dark:text-white/60 text-[#00165F]/60 mb-1.5 block">
                    Tapez <strong className="text-red-400">CONFIRMER</strong> pour valider
                  </label>
                  <input
                    value={confirmText}
                    onChange={e => setConfirmText(e.target.value)}
                    placeholder="CONFIRMER"
                    className="w-full px-3 py-2.5 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-[#00165F] text-sm focus:outline-none focus:border-red-400"
                  />
                </div>
              </div>
            )}

            {error && <p className="text-xs text-red-400">{error}</p>}

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { setModal(false); setConfirmText(''); setError(''); }}
                className="flex-1 py-2.5 rounded-xl border dark:border-white/20 border-gray-300 text-sm font-semibold dark:text-white/70 text-[#00165F]/70"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || loading}
                className={`flex-1 py-2.5 rounded-xl text-white text-sm font-black transition disabled:opacity-40 flex items-center justify-center gap-2 ${
                  isIrrevocable ? 'bg-red-500 hover:bg-red-600' : 'bg-orange-500 hover:bg-orange-600'
                }`}
              >
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> En cours...</>
                  : isPause ? 'Activer la pause' : 'Je comprends, suspendre mon compte'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
