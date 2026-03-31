'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Users, Gamepad2, Clock, Trash2 } from 'lucide-react';
import { formatSKY, computeNetPot, computePrizes } from '@/lib/currency';
import { getAuthToken } from '@/lib/get-auth-token';
import { useI18n } from '@/components/i18n/I18nProvider';

const TYPE_COLORS: Record<string, string> = {
  DUEL: 'bg-blue-500',
  SMALL_CHALLENGE: 'bg-green-500',
  STANDARD: 'bg-purple-500',
  MEDIUM_TOURNAMENT: 'bg-orange-500',
  BIG_TOURNAMENT: 'bg-red-500',
  PREMIUM_TOURNAMENT: 'bg-yellow-500',
};

const STATUS_DOTS: Record<string, { dotClass: string; textClass: string }> = {
  OPEN:        { dotClass: 'bg-green-400',            textClass: 'text-green-400' },
  FULL:        { dotClass: 'bg-orange-400',           textClass: 'text-orange-400' },
  IN_PROGRESS: { dotClass: 'bg-red-500 animate-pulse',textClass: 'text-red-400' },
  VALIDATING:  { dotClass: 'bg-yellow-400 animate-pulse', textClass: 'text-yellow-400' },
  COMPLETED:   { dotClass: 'bg-gray-400',             textClass: 'text-gray-400' },
  DISPUTED:    { dotClass: 'bg-red-600',              textClass: 'text-red-500' },
  CANCELLED:   { dotClass: 'bg-gray-500',             textClass: 'text-gray-500' },
};

interface Challenge {
  id: string;
  title: string;
  game: string;
  type: string;
  status: string;
  entryFee: number;
  maxPlayers: number;
  commission: number;
  potTotal: number;
  expiresAt: string;
  creatorId?: string;
  _count?: { participants: number };
}

interface ChallengeCardProps {
  challenge: Challenge;
  onJoin?: () => void;
  onDelete?: () => void;
  currentUserId?: string;
}

function useCountdown(target: string) {
  const [remaining, setRemaining] = useState('');
  useEffect(() => {
    const update = () => {
      const diff = new Date(target).getTime() - Date.now();
      if (diff <= 0) { setRemaining('__expired__'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [target]);
  return remaining;
}

const ChallengeCard = ({ challenge, onJoin, onDelete, currentUserId }: ChallengeCardProps) => {
  const router = useRouter();
  const { t } = useI18n();
  const [deleting, setDeleting] = useState(false);
  const count = challenge._count?.participants ?? 0;
  const progress = (count / challenge.maxPlayers) * 100;
  const netPot = computeNetPot(challenge.potTotal, challenge.commission);
  const prizes = computePrizes(netPot);
  const TYPE_LABELS: Record<string, string> = {
    DUEL: t('challenge.type.duel'), SMALL_CHALLENGE: t('challenge.type.small'),
    STANDARD: t('challenge.type.standard'), MEDIUM_TOURNAMENT: t('challenge.type.medium'),
    BIG_TOURNAMENT: t('challenge.type.big'), PREMIUM_TOURNAMENT: t('challenge.type.premium'),
  };
  const STATUS_LABELS: Record<string, string> = {
    OPEN: t('challenge.status.open'), FULL: t('challenge.status.full'),
    IN_PROGRESS: t('challenge.status.inProgress'), VALIDATING: t('challenge.status.validating'),
    COMPLETED: t('challenge.status.completed'), DISPUTED: t('challenge.status.disputed'),
    CANCELLED: t('challenge.status.cancelled'),
  };
  const typeColor = TYPE_COLORS[challenge.type] ?? 'bg-gray-500';
  const statusDots = STATUS_DOTS[challenge.status] ?? { dotClass: 'bg-gray-400', textClass: 'text-gray-400' };
  const typeLabel = TYPE_LABELS[challenge.type] ?? challenge.type;
  const statusLabel = STATUS_LABELS[challenge.status] ?? challenge.status;
  const rawCountdown = useCountdown(challenge.expiresAt);
  const countdown = rawCountdown === '__expired__' ? t('challenge.card.expired') : rawCountdown;
  const isTimeLow = new Date(challenge.expiresAt).getTime() - Date.now() < 5 * 60 * 1000;
  const isCreator = currentUserId && challenge.creatorId === currentUserId;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(t('challenge.card.delete.confirm'))) return;
    
    setDeleting(true);
    try {
      const token = getAuthToken();
      const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
      const res = await fetch(`${API}/challenges/${challenge.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(t('challenge.card.delete.error'));
      onDelete?.();
    } catch (err) {
      alert(t('challenge.card.delete.error'));
      setDeleting(false);
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="rounded-xl border dark:border-white/10 border-[#00165F]/10 dark:bg-white/5 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
      onClick={() => router.push(`/challenges/${challenge.id}`)}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#0097FC] to-[#00165F] flex items-center justify-center shrink-0">
              <Gamepad2 className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm dark:text-white text-[#00165F] truncate">
                {challenge.title}
              </h3>
              <p className="text-xs dark:text-white/50 text-[#00165F]/50">{challenge.game}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full text-white ${typeColor}`}>
              {typeLabel}
            </span>
            {isCreator && challenge.status === 'OPEN' && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors disabled:opacity-50"
                title={t('challenge.card.delete.title')}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Pot */}
        <div className="mb-3 text-center py-2 rounded-lg dark:bg-white/5 bg-[#0097FC]/5">
          <p className="text-xs dark:text-white/50 text-[#00165F]/50 mb-0.5">{t('challenge.card.prizePool')}</p>
          <p className="text-xl font-black text-[#0097FC]">🪙 {formatSKY(challenge.potTotal)}</p>
          <p className="text-xs text-[#FD2E5F] font-semibold">
            {t('challenge.card.top1')} {formatSKY(prizes.first)}
          </p>
        </div>

        {/* Pass */}
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="dark:text-white/50 text-[#00165F]/50">{t('challenge.card.pass')}</span>
          <span className="dark:text-white text-[#00165F] font-semibold">🪙 {formatSKY(challenge.entryFee)}</span>
        </div>

        {/* Progress */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <div className="flex items-center gap-1 dark:text-white/50 text-[#00165F]/50">
              <Users className="w-3 h-3" />
              <span>{count}/{challenge.maxPlayers} {t('challenge.card.players')}</span>
            </div>
            <div className={`flex items-center gap-1 ${statusDots.textClass}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusDots.dotClass}`} />
              {statusLabel}
            </div>
          </div>
          <div className="h-1.5 rounded-full dark:bg-white/10 bg-[#00165F]/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#0097FC] to-[#00165F]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Timer / Action */}
        {challenge.status === 'OPEN' && (
          <div className="flex items-center justify-between gap-2">
            <div className={`flex items-center gap-1 text-xs ${isTimeLow ? 'text-red-500 animate-pulse' : 'dark:text-white/40 text-[#00165F]/40'}`}>
              <Clock className="w-3 h-3" />
              <span>{countdown}</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onJoin?.() ?? router.push(`/challenges/${challenge.id}`); }}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#0097FC] hover:bg-[#0097FC]/90 text-white transition-colors hover:scale-105 transform"
            >
              {t('challenge.card.join')}
            </button>
          </div>
        )}
        {challenge.status === 'FULL' && (
          <div className={`text-center text-xs font-semibold py-1.5 rounded-lg ${isTimeLow ? 'bg-red-500/10 text-red-400 animate-pulse' : 'bg-orange-500/10 text-orange-400'}`}>
            ⚡ {t('challenge.card.starting')} {countdown}
          </div>
        )}
        {challenge.status === 'IN_PROGRESS' && (
          <div className="text-center text-xs font-semibold py-1.5 rounded-lg bg-red-500/10 text-red-400 animate-pulse">
            {t('challenge.card.inProgress')}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ChallengeCard;
