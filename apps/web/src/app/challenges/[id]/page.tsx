'use client';

import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import SpectatorView, { type SpectatorEvent } from '@/components/challenges/SpectatorView';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Trophy, Clock, CheckCircle, AlertTriangle, Upload, Calendar } from 'lucide-react';
import { formatSKY, computeNetPot, computePrizes } from '@/lib/currency';
import ChallengeRules from '@/components/challenges/ChallengeRules';
import AdSlot from '@/components/ads/AdSlot';
import { useI18n } from '@/components/i18n/I18nProvider';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'text-green-400 bg-green-400/10',
  FULL: 'text-orange-400 bg-orange-400/10',
  IN_PROGRESS: 'text-red-400 bg-red-400/10 animate-pulse',
  VALIDATING: 'text-yellow-400 bg-yellow-400/10',
  COMPLETED: 'text-gray-400 bg-gray-400/10',
  DISPUTED: 'text-red-500 bg-red-500/10',
  CANCELLED: 'text-gray-500 bg-gray-500/10',
};

function getToken() {
  if (typeof window === 'undefined') return '';
  try {
    const stored = window.localStorage.getItem('skyplay-auth');
    if (!stored) return '';
    const parsed = JSON.parse(stored);
    const tokens = parsed?.state?.tokens || parsed?.tokens;
    return tokens?.idToken || tokens?.accessToken || '';
  } catch {
    return '';
  }
}

export default function ChallengePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useI18n();
  const [challenge, setChallenge] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [rank, setRank] = useState(1);
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [showRules, setShowRules] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<{ submittedCount: number; totalPlayers: number } | null>(null);
  const [spectatorEvents, setSpectatorEvents] = useState<SpectatorEvent[]>([]);

  const addEvent = useCallback((icon: string, text: string) => {
    setSpectatorEvents(prev => [...prev, { id: `${Date.now()}-${Math.random()}`, icon, text, at: new Date() }]);
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API}/challenges/${id}`);
      if (!res.ok) throw new Error('__notfound__');
      const data = await res.json();
      setChallenge(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    try {
      const token = getToken();
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(payload.sub || payload.id || null);
      }
    } catch {}
  }, [load]);

  useEffect(() => {
    const token = getToken();
    if (!token || !id) return;
    const s = io(`${API}/chat`, { auth: { token }, transports: ['websocket', 'polling'] });
    s.on('connect', () => { s.emit('join_challenge_room', { challengeId: id }); });
    s.on('challenge_started',   () => { addEvent('🎮', 'Match démarré'); load(); });
    s.on('challenge_update',    () => { load(); });
    s.on('challenge_completed', () => { addEvent('🏆', 'Résultat validé'); load(); });
    s.on('challenge_disputed',  () => { addEvent('⚠️', 'Litige ouvert'); load(); });
    s.on('result_submitted', (data: { submittedCount: number; totalPlayers: number }) => {
      setSubmissionStatus({ submittedCount: data.submittedCount, totalPlayers: data.totalPlayers });
      addEvent('✅', `Un joueur a soumis son résultat (${data.submittedCount}/${data.totalPlayers})`);
    });
    return () => {
      s.emit('leave_challenge_room', { challengeId: id });
      s.disconnect();
    };
  }, [id, addEvent, load]);

  const doAction = async (endpoint: string, body: object) => {
    setActionLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/challenges/${id}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erreur');
      }
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0097FC]/30 border-t-[#0097FC] rounded-full animate-spin" />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="dark:text-white/60 text-[#00165F]/60">{(error === '__notfound__' ? t('challenge.detail.notFound') : error) || t('challenge.detail.notFound')}</p>
        <button onClick={() => router.push('/challenges')} className="text-[#0097FC] underline">{t('challenge.detail.back')}</button>
      </div>
    );
  }

  const netPot = computeNetPot(challenge.potTotal, challenge.commission);
  const prizes = computePrizes(netPot);
  const TYPE_LABELS: Record<string, string> = {
    DUEL: 'Duel 1v1', SMALL_CHALLENGE: t('challenge.type.small'), STANDARD: t('challenge.type.standard'),
    MEDIUM_TOURNAMENT: t('challenge.type.medium'), BIG_TOURNAMENT: t('challenge.type.big'), PREMIUM_TOURNAMENT: t('challenge.type.premium'),
  };
  const STATUS_LABELS: Record<string, string> = {
    OPEN: t('challenge.status.open'), FULL: t('challenge.status.full'),
    IN_PROGRESS: t('challenge.status.inProgress'), VALIDATING: t('challenge.status.validating'),
    COMPLETED: t('challenge.status.completed'), DISPUTED: t('challenge.status.disputed'),
    CANCELLED: t('challenge.status.cancelled'),
  };
  const statusColor = STATUS_COLORS[challenge.status] ?? 'text-gray-400 bg-gray-400/10';
  const statusLabel = STATUS_LABELS[challenge.status] ?? challenge.status;
  const isParticipant = challenge.participants?.some((p: any) => p.userId === currentUserId);
  const myParticipant = challenge.participants?.find((p: any) => p.userId === currentUserId);
  const myResult = challenge.results?.find((r: any) => r.userId === currentUserId);
  const sortedResults = challenge.results ? [...challenge.results].sort((a: any, b: any) => a.declaredRank - b.declaredRank) : [];

  return (
    <div className="min-h-screen dark:bg-[#00165F]/5 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Back */}
        <button
          onClick={() => router.push('/challenges')}
          className="flex items-center gap-2 text-sm dark:text-white/50 text-[#00165F]/50 hover:text-[#0097FC] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> {t('challenge.detail.back')}
        </button>

        {/* AdSlot VIDEO_PRE — avant le début du match */}
        {challenge.status === 'IN_PROGRESS' && (
          <AdSlot type="VIDEO_PRE" game={challenge.game} className="mb-4" />
        )}

        {/* Section 1 — Header */}
        <div className="rounded-2xl dark:bg-white/5 bg-white border dark:border-white/10 border-gray-100 p-4 sm:p-6 mb-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-black dark:text-white text-[#00165F] leading-tight">{challenge.title}</h1>
              <p className="dark:text-white/50 text-[#00165F]/50 text-xs sm:text-sm mt-0.5">{challenge.game} · {TYPE_LABELS[challenge.type] ?? challenge.type}</p>
            </div>
            <span className={`px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold shrink-0 ${statusColor}`}>
              {statusLabel}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm dark:text-white/50 text-[#00165F]/50">
            <span>{t('challenge.detail.createdBy')} <strong className="dark:text-white text-[#00165F]">{challenge.creator?.username}</strong></span>
            <span className="hidden sm:inline">·</span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {challenge.participants?.length ?? 0}/{challenge.maxPlayers} {t('challenge.detail.players')}
            </span>
          </div>
        </div>

        {/* Calendar button for tournament-type challenges */}
        {challenge.type?.includes('TOURNAMENT') && challenge.status !== 'OPEN' && (
          <div className="mb-4">
            <button
              onClick={() => router.push(`/challenges/${id}/calendar`)}
              className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-transparent border border-[#2a2d3e] text-cyan-400 font-semibold rounded-lg hover:bg-cyan-400/10 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              Voir le calendrier
            </button>
          </div>
        )}

        {/* Section Spectateur */}
        {!isParticipant && challenge.status === 'IN_PROGRESS' && (
          <SpectatorView
            challenge={challenge}
            submissionStatus={submissionStatus}
            events={spectatorEvents}
            prizes={prizes}
          />
        )}

        {/* Banner Gains en attente / Remboursement */}
        {isParticipant && challenge.status === 'CANCELLED' && myParticipant?.hasPaid && (
          <div className="rounded-2xl bg-yellow-500/10 border border-yellow-500/30 p-4 mb-4 flex items-start gap-3">
            <span className="text-xl">💸</span>
            <div>
              <p className="font-bold text-yellow-400 text-sm">{t('challenge.winnings.cancelled')}</p>
              <p className="text-xs text-yellow-400/70 mt-0.5">
                {Number(challenge.entryFee ?? 0).toLocaleString('fr-FR')} {t('challenge.winnings.paid.desc')}
              </p>
            </div>
          </div>
        )}
        {isParticipant && challenge.status === 'COMPLETED' && myParticipant?.winningsStatus === 'PENDING_REVIEW' && (
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 mb-4 flex items-start gap-3">
            <span className="text-xl">🔍</span>
            <div>
              <p className="font-bold text-amber-400 text-sm">{t('challenge.winnings.review.title')}</p>
              <p className="text-xs text-amber-400/70 mt-0.5">
                {Number(myParticipant?.winnings ?? 0).toLocaleString('fr-FR')} SKY — {t('challenge.winnings.review.desc')}
              </p>
            </div>
          </div>
        )}
        {isParticipant && challenge.status === 'COMPLETED' && myParticipant?.winningsStatus === 'AUTO_APPROVED' && (
          <div className="rounded-2xl bg-blue-500/10 border border-blue-500/30 p-4 mb-4 flex items-start gap-3">
            <span className="text-xl">⏳</span>
            <div>
              <p className="font-bold text-blue-400 text-sm">{t('challenge.winnings.autoApproved.title')}</p>
              <p className="text-xs text-blue-400/70 mt-0.5">
                {Number(myParticipant?.winnings ?? 0).toLocaleString('fr-FR')} SKY — {t('challenge.winnings.autoApproved.desc')}
              </p>
            </div>
          </div>
        )}
        {isParticipant && challenge.status === 'COMPLETED' && myParticipant?.winningsStatus === 'REJECTED' && (
          <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-4 mb-4 flex items-start gap-3">
            <span className="text-xl">❌</span>
            <div>
              <p className="font-bold text-red-400 text-sm">{t('challenge.winnings.rejected.title')}</p>
              <p className="text-xs text-red-400/70 mt-0.5">
                {myParticipant?.winningsRejectReason ?? 'Contactez support@skyplay.cm pour plus d\'informations.'}
              </p>
            </div>
          </div>
        )}
        {isParticipant && challenge.status === 'COMPLETED' && myParticipant?.winningsStatus === 'PAID' && (myParticipant?.winnings ?? 0) > 0 && (
          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4 mb-4 flex items-start gap-3">
            <span className="text-xl">✅</span>
            <div>
              <p className="font-bold text-emerald-400 text-sm">{t('challenge.winnings.paid.title')}</p>
              <p className="text-xs text-emerald-400/70 mt-0.5">
                {Number(myParticipant?.winnings ?? 0).toLocaleString('fr-FR')} SKY — {t('challenge.winnings.paid.desc')}
              </p>
            </div>
          </div>
        )}

        {/* Section 2 — Pot & Distribution */}
        <div className="rounded-2xl dark:bg-white/5 bg-white border dark:border-white/10 border-gray-100 p-4 sm:p-6 mb-4">
          <div className="text-center mb-4">
            <p className="text-xs dark:text-white/50 text-[#00165F]/50 mb-1">{t('challenge.detail.prizePool')}</p>
            <p className="text-3xl sm:text-4xl font-black text-[#0097FC]">🪙 {formatSKY(challenge.potTotal)}</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { medal: '🥇', label: t('challenge.detail.rank1'), amount: prizes.first },
              { medal: '🥈', label: t('challenge.detail.rank2'), amount: prizes.second },
              { medal: '🥉', label: t('challenge.detail.rank3'), amount: prizes.third },
            ].map(({ medal, label, amount }) => (
              <div key={label} className="rounded-xl dark:bg-white/5 bg-gray-50 p-3">
                <p className="text-lg">{medal}</p>
                <p className="text-xs dark:text-white/50 text-[#00165F]/50">{label}</p>
                <p className="font-bold text-[#FD2E5F] text-sm">{formatSKY(amount)}</p>
              </div>
            ))}
          </div>
          <p className="text-xs dark:text-white/40 text-[#00165F]/40 text-center mt-3">
            {t('challenge.detail.orgFee')} {Math.round(challenge.commission * 100)}%
          </p>
        </div>

        {/* Section 3 — Participants */}
        <div className="rounded-2xl dark:bg-white/5 bg-white border dark:border-white/10 border-gray-100 p-4 sm:p-6 mb-4">
          <h2 className="font-bold dark:text-white text-[#00165F] mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#0097FC]" /> {t('challenge.detail.participants')}
          </h2>
          <div className="space-y-2">
            {challenge.participants?.length === 0 ? (
              <p className="text-sm dark:text-white/40 text-[#00165F]/40">{t('challenge.detail.noParticipants')}</p>
            ) : (
              challenge.participants?.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0097FC] to-[#00165F] flex items-center justify-center text-white text-xs font-bold">
                      {p.user?.username?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm dark:text-white text-[#00165F]">{p.user?.username}</span>
                    {p.userId === currentUserId && <span className="text-xs text-[#0097FC]">{t('challenge.detail.you')}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {p.rank && <span className="text-xs font-bold text-[#FD2E5F]">#{p.rank}</span>}
                    {p.winnings && p.winnings > 0 && <span className="text-xs text-[#0097FC]">🪙 {formatSKY(p.winnings)}</span>}
                    {p.hasPaid ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <Clock className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Calendar button — tournament IN_PROGRESS with 2+ participants */}
        {challenge.status === 'IN_PROGRESS' && (challenge.participants?.length ?? 0) >= 2 && (
          <div className="mb-4">
            <a
              href={`/challenges/${id}/calendar`}
              className="w-full flex items-center justify-center gap-2 bg-[#1a1d2e] border border-cyan-500 text-cyan-400 rounded-xl py-3 font-semibold hover:bg-cyan-500 hover:text-black transition"
            >
              📅 Voir le calendrier
            </a>
          </div>
        )}

        {/* Section 4 — Actions */}
        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-red-400 text-sm mb-4">
            {error}
          </div>
        )}

        {/* OPEN — S'inscrire */}
        {challenge.status === 'OPEN' && !isParticipant && (
          <div className="rounded-2xl dark:bg-white/5 bg-white border dark:border-white/10 border-gray-100 p-4 sm:p-6 mb-4">
            <h2 className="font-bold dark:text-white text-[#00165F] mb-3">{t('challenge.detail.join.title')}</h2>
            <div className="rounded-xl dark:bg-[#FD2E5F]/10 bg-red-50 border border-[#FD2E5F]/20 p-3 mb-4">
              <p className="text-sm text-[#FD2E5F] font-semibold text-center">
                {t('challenge.detail.join.fee')} {formatSKY(challenge.entryFee)}
              </p>
            </div>
            <button
              onClick={() => setShowRules(true)}
              className="w-full py-3 rounded-xl bg-[#0097FC] hover:bg-[#0097FC]/90 text-white font-bold transition-all hover:scale-[1.02]"
            >
              {t('challenge.detail.join.btn')} (🪙 {formatSKY(challenge.entryFee)})
            </button>
          </div>
        )}

        {/* Règlement de compétition modal */}
        {showRules && (
          <ChallengeRules
            challenge={challenge}
            prizeFirst={prizes.first}
            onAccept={() => { setShowRules(false); doAction('join', {}); }}
            onCancel={() => setShowRules(false)}
            actionLoading={actionLoading}
          />
        )}

        {/* IN_PROGRESS — Déclarer résultat */}
        {(challenge.status === 'IN_PROGRESS' || challenge.status === 'VALIDATING') && isParticipant && !myResult && (
          <div className="rounded-2xl dark:bg-white/5 bg-white border dark:border-white/10 border-gray-100 p-4 sm:p-6 mb-4">
            <h2 className="font-bold dark:text-white text-[#00165F] mb-4">{t('challenge.detail.result.title')}</h2>
            <div className="mb-4">
              <label className="text-xs font-semibold dark:text-white/60 text-[#00165F]/60 mb-2 block">{t('challenge.detail.result.rank')}</label>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                {Array.from({ length: Math.min(challenge.participants?.length ?? 10, 10) }, (_, i) => i + 1).map(r => (
                  <button
                    key={r}
                    onClick={() => setRank(r)}
                    className={`py-2 rounded-lg font-bold text-sm transition-colors ${rank === r ? 'bg-[#0097FC] text-white' : 'dark:bg-white/10 bg-gray-100 dark:text-white text-[#00165F]'}`}
                  >
                    #{r}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="text-xs font-semibold dark:text-white/60 text-[#00165F]/60 mb-2 block">{t('challenge.detail.result.screenshot')}</label>
              <input
                type="text"
                value={screenshotUrl}
                onChange={e => setScreenshotUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2.5 rounded-xl dark:bg-white/10 bg-gray-50 dark:text-white text-[#00165F] border dark:border-white/10 border-gray-200 focus:outline-none focus:border-[#0097FC] text-sm"
              />
            </div>
            <button
              onClick={() => doAction('submit-result', { rank, screenshotUrl: screenshotUrl || undefined })}
              disabled={actionLoading}
              className="w-full py-3 rounded-xl bg-[#0097FC] text-white font-bold hover:bg-[#0097FC]/90 disabled:opacity-50"
            >
              {actionLoading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" /> : t('challenge.detail.result.submit')}
            </button>
          </div>
        )}

        {/* VALIDATING — Résultat soumis */}
        {(challenge.status === 'VALIDATING') && isParticipant && myResult && (
          <div className="rounded-2xl dark:bg-white/5 bg-white border dark:border-white/10 border-gray-100 p-4 sm:p-6 mb-4 text-center">
            <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
            <p className="font-bold dark:text-white text-[#00165F]">{t('challenge.detail.result.submitted')}{myResult.declaredRank}</p>
            <p className="text-sm dark:text-white/50 text-[#00165F]/50 mt-1">{t('challenge.detail.result.waiting')}</p>
          </div>
        )}

        {/* COMPLETED — Podium */}
        {challenge.status === 'COMPLETED' && (
          <div className="rounded-2xl dark:bg-white/5 bg-white border dark:border-white/10 border-gray-100 p-4 sm:p-6 mb-4">
            <h2 className="font-bold dark:text-white text-[#00165F] mb-4 text-center">{t('challenge.detail.podium.title')}</h2>
            <div className="space-y-3">
              {sortedResults.map((r: any) => (
                <motion.div
                  key={r.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className={`flex items-center justify-between p-3 rounded-xl ${r.declaredRank === 1 ? 'bg-yellow-500/10 border border-yellow-500/30' : r.declaredRank === 2 ? 'bg-gray-400/10 border border-gray-400/20' : r.declaredRank === 3 ? 'bg-orange-500/10 border border-orange-500/20' : 'dark:bg-white/5 bg-gray-50'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{r.declaredRank === 1 ? '🥇' : r.declaredRank === 2 ? '🥈' : r.declaredRank === 3 ? '🥉' : `#${r.declaredRank}`}</span>
                    <span className="font-semibold dark:text-white text-[#00165F]">{r.user?.username}</span>
                  </div>
                  {r.declaredRank <= 3 && (
                    <span className="font-black text-[#FD2E5F]">
                      🪙 {formatSKY(r.declaredRank === 1 ? prizes.first : r.declaredRank === 2 ? prizes.second : prizes.third)}
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* DISPUTED */}
        {challenge.status === 'DISPUTED' && (
          <div className="rounded-2xl dark:bg-red-500/5 bg-red-50 border border-red-500/20 p-4 sm:p-6 mb-4">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <h2 className="font-bold text-red-400">{t('challenge.status.disputed')}</h2>
            </div>
            <p className="text-sm dark:text-white/60 text-[#00165F]/60">{challenge.dispute?.reason}</p>
            {challenge.dispute?.status === 'RESOLVED' && (
              <p className="text-sm text-green-400 font-semibold mt-3">✅ Résolu — {challenge.dispute.adminNote}</p>
            )}
          </div>
        )}

        {/* Force dispute button (IN_PROGRESS/VALIDATING participant) */}
        {(challenge.status === 'IN_PROGRESS' || challenge.status === 'VALIDATING') && isParticipant && (
          <div className="rounded-2xl dark:bg-white/5 bg-white border dark:border-white/10 border-gray-100 p-4 mb-4">
            <p className="text-xs dark:text-white/40 text-[#00165F]/40 mb-2">{t('challenge.detail.dispute.title')}</p>
            <div className="flex flex-col xs:flex-row gap-2">
              <input
                type="text"
                value={disputeReason}
                onChange={e => setDisputeReason(e.target.value)}
                placeholder={t('challenge.detail.dispute.placeholder')}
                className="flex-1 px-3 py-2 rounded-lg dark:bg-white/10 bg-gray-50 dark:text-white text-[#00165F] border dark:border-white/10 border-gray-200 text-sm focus:outline-none focus:border-[#FD2E5F]"
              />
              <button
                onClick={() => doAction('dispute', { reason: disputeReason })}
                disabled={!disputeReason || actionLoading}
                className="w-full xs:w-auto px-4 py-2 rounded-lg bg-[#FD2E5F]/20 text-[#FD2E5F] font-semibold text-sm disabled:opacity-40 hover:bg-[#FD2E5F]/30"
              >
                {t('challenge.detail.dispute.submit')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
