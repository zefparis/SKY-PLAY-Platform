'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw, Swords, Trophy, Gamepad2 } from 'lucide-react';
import ChallengeCard from '@/components/challenges/ChallengeCard';
import CreateChallengeModal from '@/components/challenges/CreateChallengeModal';
import { useI18n } from '@/components/i18n/I18nProvider';
import { useAuthStore } from '@/lib/auth-store';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const GAMES_EN = ['All', 'FIFA', 'COD', 'Fortnite', 'PUBG', 'Free Fire', 'Mobile Legends', 'Other'];
const GAMES_FR = ['Tous', 'FIFA', 'COD', 'Fortnite', 'PUBG', 'Free Fire', 'Mobile Legends', 'Autre'];

export default function ChallengesPage() {
  const { t, lang } = useI18n();
  const { user } = useAuthStore();
  const GAMES = lang === 'fr' ? GAMES_FR : GAMES_EN;
  const TYPE_FILTERS = [
    { key: '', label: t('challenges.filter.all') },
    { key: 'DUEL', label: '1v1' },
    { key: 'SMALL_CHALLENGE', label: 'Challenge' },
    { key: 'STANDARD', label: 'Standard' },
    { key: 'MEDIUM_TOURNAMENT', label: lang === 'fr' ? 'Tournoi M' : 'Tournament M' },
    { key: 'BIG_TOURNAMENT', label: lang === 'fr' ? 'Tournoi L' : 'Tournament L' },
    { key: 'PREMIUM_TOURNAMENT', label: 'Premium' },
  ];
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [gameFilter, setGameFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('OPEN');

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams({ status: statusFilter });
      if (typeFilter) params.set('type', typeFilter);
      if (gameFilter && gameFilter !== 'Tous') params.set('game', gameFilter);
      const res = await fetch(`${API}/challenges?${params}`);
      const data = await res.json();
      setChallenges(data.challenges ?? []);
    } catch {
      setChallenges([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, gameFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, [load]);

  return (
    <div className="min-h-screen dark:bg-[#00165F]/5 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black dark:text-white text-[#00165F] flex items-center gap-2 sm:gap-3">
              <Swords className="w-6 h-6 sm:w-8 sm:h-8 text-[#0097FC] shrink-0" />
              {t('challenges.title')}
            </h1>
            <p className="dark:text-white/60 text-[#00165F]/60 mt-1 text-sm sm:text-base">
              {t('challenges.subtitle')}
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0097FC] hover:bg-[#0097FC]/90 text-white font-bold transition-all hover:scale-105 shadow-lg shadow-[#0097FC]/20"
          >
            <Plus className="w-5 h-5" />
            {t('challenges.create')}
          </button>
        </div>

        {/* Filters */}
        <div className="space-y-2 sm:space-y-3 mb-5 sm:mb-6">
          {/* Type */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {TYPE_FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setTypeFilter(f.key)}
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  typeFilter === f.key
                    ? 'bg-[#0097FC] text-white'
                    : 'dark:bg-white/10 bg-white dark:text-white/70 text-[#00165F]/70 hover:bg-[#0097FC]/20'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          {/* Status + Game */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center">
            {['OPEN', 'IN_PROGRESS', 'VALIDATING', 'COMPLETED'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s === statusFilter ? '' : s)}
                className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === s
                    ? 'bg-[#FD2E5F] text-white'
                    : 'dark:bg-white/10 bg-white dark:text-white/60 text-[#00165F]/60'
                }`}
              >
                {s === 'OPEN' ? t('challenges.filter.open') : s === 'IN_PROGRESS' ? t('challenges.filter.inProgress') : s === 'VALIDATING' ? t('challenges.filter.validating') : t('challenges.filter.completed')}
              </button>
            ))}
            <select
              value={gameFilter}
              onChange={e => setGameFilter(e.target.value)}
              className="px-2.5 sm:px-3 py-1 rounded-lg text-xs dark:bg-white/10 bg-white dark:text-white text-[#00165F] border dark:border-white/10 border-[#00165F]/10 max-w-[110px] sm:max-w-none"
            >
              {GAMES.map((g, i) => <option key={g} value={i === 0 ? '' : g}>{g}</option>)}
            </select>
            <button onClick={load} className="ml-auto dark:text-white/40 text-[#00165F]/40 hover:text-[#0097FC]">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 rounded-xl dark:bg-white/5 bg-white animate-pulse" />
            ))}
          </div>
        ) : challenges.length === 0 ? (
          <div className="text-center py-20">
            <Trophy className="w-16 h-16 mx-auto dark:text-white/20 text-[#00165F]/20 mb-4" />
            <p className="dark:text-white/50 text-[#00165F]/50 text-lg">{t('challenges.noChallenge')}</p>
            <p className="dark:text-white/30 text-[#00165F]/30 text-sm mt-2">{t('challenges.noChallenge.sub')}</p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-6 px-6 py-3 rounded-xl bg-[#0097FC] text-white font-bold hover:scale-105 transition-transform"
            >
              {t('challenges.createFirst')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {challenges.map((c) => (
              <ChallengeCard key={c.id} challenge={c} />
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateChallengeModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); load(); }}
        />
      )}
    </div>
  );
}
