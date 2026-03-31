'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, Plus, ArrowUpRight, ArrowDownLeft, Gamepad2,
  RefreshCw, TrendingUp, TrendingDown, Trophy, FlaskConical,
  Shield, Lock, CreditCard, Settings2,
} from 'lucide-react';
import { formatSKY } from '@/lib/currency';
import { useAuthStore } from '@/lib/auth-store';
import DepositModal from '@/components/wallet/DepositModal';
import WithdrawModal from '@/components/wallet/WithdrawModal';
import { useI18n } from '@/components/i18n/I18nProvider';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const IS_TEST = process.env.NEXT_PUBLIC_FLW_ENV !== 'production';

const TX_TYPE_COLORS: Record<string, { color: string; icon: string }> = {
  DEPOSIT:          { color: 'text-green-400',  icon: '↓' },
  WITHDRAWAL:       { color: 'text-red-400',    icon: '↑' },
  CHALLENGE_DEBIT:  { color: 'text-blue-400',   icon: '🎮' },
  CHALLENGE_CREDIT: { color: 'text-[#0097FC]',  icon: '🏆' },
  CHALLENGE_ENTRY:  { color: 'text-blue-400',   icon: '🎮' },
  CHALLENGE_WIN:    { color: 'text-[#0097FC]',  icon: '🏆' },
  REFUND:           { color: 'text-yellow-400', icon: '↩' },
  COMMISSION:       { color: 'text-gray-400',   icon: '·' },
  DEBIT:            { color: 'text-red-400',    icon: '↑' },
  CREDIT:           { color: 'text-green-400',  icon: '↓' },
  TEST_CREDIT:      { color: 'text-amber-400',  icon: '🧪' },
};

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: 'text-green-400 bg-green-400/10',
  PENDING:   'text-yellow-400 bg-yellow-400/10',
  FAILED:    'text-red-400 bg-red-400/10',
  CANCELLED: 'text-gray-400 bg-gray-400/10',
};

export default function WalletPage() {
  const { t } = useI18n();
  const idToken = useAuthStore((s) => s.tokens?.idToken);
  const initialized = useAuthStore((s) => s.initialized);
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

  const loadWallet = useCallback(async (token: string) => {
    try {
      const res = await fetch(`${API}/wallet`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      setWallet(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  const loadTransactions = useCallback(async (token: string, p: number, f: string, append = false) => {
    setTxLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: '20' });
      if (f !== 'ALL') params.set('type', f);
      const res = await fetch(`${API}/wallet/transactions?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const data = await res.json();
      setTotal(data.total);
      setTransactions(prev => append ? [...prev, ...data.transactions] : data.transactions);
    } catch {} finally {
      setTxLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialized) return;
    if (!idToken) { setLoading(false); return; }
    loadWallet(idToken);
  }, [initialized, idToken, loadWallet]);

  useEffect(() => {
    if (!initialized || !idToken) return;
    setPage(1); setTransactions([]);
    loadTransactions(idToken, 1, filter);
  }, [filter, initialized, idToken, loadTransactions]);

  const handleLoadMore = () => {
    if (!idToken) return;
    const next = page + 1;
    setPage(next);
    loadTransactions(idToken, next, filter, true);
  };

  const handleRefresh = () => {
    if (!idToken) return;
    loadWallet(idToken);
    loadTransactions(idToken, 1, filter);
    setPage(1);
  };

  const handleDepositSuccess = () => {
    if (!idToken) return;
    loadWallet(idToken);
    loadTransactions(idToken, 1, filter);
    setPage(1);
  };
  const handleWithdrawSuccess = () => {
    if (!idToken) return;
    loadWallet(idToken);
    loadTransactions(idToken, 1, filter);
    setPage(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0097FC]/30 border-t-[#0097FC] rounded-full animate-spin" />
      </div>
    );
  }

  if (!idToken) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
        <Wallet className="w-14 h-14 dark:text-white/20 text-[#00165F]/20" />
        <p className="text-lg font-bold dark:text-white text-[#00165F]">{t('wallet.loginRequired')}</p>
        <a href="/login" className="px-6 py-2.5 rounded-xl bg-[#0097FC] text-white font-bold text-sm hover:bg-[#0097FC]/90 transition">
          {t('wallet.signIn')}
        </a>
      </div>
    );
  }

  const balance = wallet?.balance ?? 0;
  const consumptionBalance = wallet?.consumptionBalance ?? 0;
  const rewardBalance = wallet?.rewardBalance ?? 0;
  const kycStatus: string = wallet?.kycStatus ?? 'PENDING';
  const limits = wallet?.limits ?? { dailyDepositLimit: 50000, weeklyDepositLimit: 200000, dailySpendLimit: 20000 };
  const stats = wallet?.stats ?? { totalDeposited: 0, totalWon: 0, totalMised: 0, gainsNets: 0 };

  return (
    <div className="min-h-screen dark:bg-[#00165F]/5 bg-gray-50 pb-12">
      {/* TEST Banner */}
      {IS_TEST && (
        <div className="bg-yellow-500/20 border-b border-yellow-500/30 px-4 py-2">
          <div className="max-w-4xl mx-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <span className="flex items-center gap-1 font-bold text-yellow-600 dark:text-yellow-400">
              <FlaskConical className="w-3.5 h-3.5" /> MODE TEST FLUTTERWAVE
            </span>
            <span className="dark:text-yellow-300/70 text-yellow-700/70">MTN succès : <strong>677777777</strong></span>
            <span className="dark:text-yellow-300/70 text-yellow-700/70">Orange succès : <strong>695959595</strong></span>
            <span className="dark:text-yellow-300/70 text-yellow-700/70">Carte : <strong>4187427415564246</strong> · 09/32 · 828</span>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* Bannière crédits test */}
        {wallet?.recentTransactions?.some((tx: any) => tx.type === 'TEST_CREDIT') && (
          <div className="mb-4 flex items-start gap-2.5 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <span className="text-lg leading-none mt-0.5">🧪</span>
            <div>
              <p className="text-sm font-bold text-amber-500 dark:text-amber-400">Crédits de test actifs — Test credits active</p>
              <p className="text-xs text-amber-600/70 dark:text-amber-400/60 mt-0.5">Ces Sky Credits sont des crédits de test. Ils ne sont pas convertibles en argent réel. · These credits are for testing only and cannot be converted to real money.</p>
            </div>
          </div>
        )}

        {/* Hero — Solde */}
        <div className="relative rounded-2xl overflow-hidden mb-6 p-6 sm:p-8 bg-gradient-to-br from-[#00165F] via-[#003399] to-[#0097FC]">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
          <div className="relative">
            <p className="text-white/70 text-sm mb-1 font-medium">{t('wallet.balance')}</p>
            <motion.p
              key={balance}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-4xl sm:text-5xl font-black text-white mb-6 tracking-tight"
            >
              🪙 {formatSKY(balance)}
            </motion.p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowDeposit(true)}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-[#00165F] font-black text-sm hover:bg-white/90 transition-all hover:scale-105 shadow-lg"
              >
                <Plus className="w-5 h-5" /> {t('wallet.deposit')}
              </button>
              <button
                onClick={() => setShowWithdraw(true)}
                disabled={balance < 1000}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/20 text-white font-bold text-sm hover:bg-white/30 transition-all border border-white/30 disabled:opacity-40"
              >
                <ArrowUpRight className="w-5 h-5" /> {t('wallet.withdraw')}
              </button>
              <button
                onClick={handleRefresh}
                className="sm:ml-auto flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-white/10 text-white/70 hover:text-white transition-colors border border-white/20"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="text-sm">{t('wallet.refresh')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: t('wallet.totalDeposited'), value: stats.totalDeposited, icon: <ArrowDownLeft className="w-4 h-4 text-green-400" />, color: 'text-green-400' },
            { label: t('wallet.totalWon'), value: stats.totalWon, icon: <Trophy className="w-4 h-4 text-[#0097FC]" />, color: 'text-[#0097FC]' },
            { label: t('wallet.totalBet'), value: stats.totalMised, icon: <Gamepad2 className="w-4 h-4 text-blue-400" />, color: 'text-blue-400' },
            { label: t('wallet.netGains'), value: stats.gainsNets, icon: stats.gainsNets >= 0 ? <TrendingUp className="w-4 h-4 text-green-400" /> : <TrendingDown className="w-4 h-4 text-red-400" />, color: stats.gainsNets >= 0 ? 'text-green-400' : 'text-red-400' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="rounded-2xl dark:bg-white/5 bg-white border dark:border-white/10 border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-2">{icon}<p className="text-xs dark:text-white/50 text-[#00165F]/50">{label}</p></div>
              <p className={`text-lg font-black ${color} tabular-nums leading-none`}>{formatSKY(Math.abs(value))}</p>
            </div>
          ))}
        </div>

        {/* Dual balance + KYC */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {/* Compte participation */}
          <div className="rounded-2xl dark:bg-white/5 bg-white border dark:border-white/10 border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-4 h-4 text-[#0097FC]" />
              <p className="text-xs font-bold dark:text-white/70 text-[#00165F]/70">💳 Compte participation</p>
            </div>
            <p className="text-xl font-black text-[#0097FC] tabular-nums">{formatSKY(consumptionBalance)}</p>
            <p className="text-xs dark:text-white/40 text-[#00165F]/40 mt-1">Sky Credits rechargés — non retirables</p>
          </div>
          {/* Compte récompenses */}
          <div className="rounded-2xl dark:bg-white/5 bg-white border dark:border-white/10 border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-[#FD2E5F]" />
              <p className="text-xs font-bold dark:text-white/70 text-[#00165F]/70">🏆 Compte récompenses</p>
            </div>
            <p className="text-xl font-black text-[#FD2E5F] tabular-nums">{formatSKY(rewardBalance)}</p>
            <p className="text-xs dark:text-white/40 text-[#00165F]/40 mt-1">Primes de performance — retirables en CFA</p>
          </div>
        </div>

        {/* KYC Banner */}
        {kycStatus !== 'VERIFIED' && (
          <a href="/profile/kyc" className="block mb-6 rounded-2xl border transition-colors
            dark:bg-white/5 bg-white dark:border-white/10 border-gray-100
            hover:border-[#0097FC]/40 hover:dark:bg-[#0097FC]/5 p-4">
            <div className="flex items-center gap-3">
              {kycStatus === 'SUBMITTED'
                ? <><Shield className="w-5 h-5 text-yellow-400 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-yellow-400">⏳ Vérification d'identité en cours (24-48h)</p>
                      <p className="text-xs dark:text-white/50 text-[#00165F]/50">Les retraits seront débloqués à la validation.</p>
                    </div>
                  </>
                : <><Lock className="w-5 h-5 text-[#FD2E5F] shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-[#FD2E5F]">🔒 Vérification d'identité requise avant retrait</p>
                      <p className="text-xs dark:text-white/50 text-[#00165F]/50">Cliquez pour compléter votre KYC et débloquer les retraits.</p>
                    </div>
                  </>
              }
              <ArrowUpRight className="w-4 h-4 dark:text-white/30 text-[#00165F]/30 ml-auto shrink-0" />
            </div>
          </a>
        )}

        {/* Limites de dépense */}
        <div className="rounded-2xl dark:bg-white/5 bg-white border dark:border-white/10 border-gray-100 p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Settings2 className="w-4 h-4 dark:text-white/50 text-[#00165F]/50" />
            <p className="text-sm font-bold dark:text-white text-[#00165F]">Limites de dépense responsable</p>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Dépôt / jour', value: limits.dailyDepositLimit },
              { label: 'Dépôt / semaine', value: limits.weeklyDepositLimit },
              { label: 'Mise / jour (défis)', value: limits.dailySpendLimit },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-xs dark:text-white/50 text-[#00165F]/50">{label}</span>
                <span className="text-xs font-bold dark:text-white text-[#00165F]">{formatSKY(value)}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] dark:text-white/30 text-[#00165F]/30 mt-2">
            Réduction immédiate · Augmentation après 48h (anti-impulsivité) · <a href="/profile/kyc" className="underline">Modifier</a>
          </p>
        </div>

        {/* Note légale sous-soldes */}
        <p className="text-[10px] dark:text-white/30 text-[#00165F]/30 text-center mb-4">
          Seules les primes de performance (🏆 Compte récompenses) sont convertibles en CFA lors du retrait.
        </p>

        {/* Historique */}
        <div className="rounded-2xl dark:bg-white/5 bg-white border dark:border-white/10 border-gray-100 overflow-hidden">
          <div className="p-4 sm:p-5 border-b dark:border-white/10 border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="font-black dark:text-white text-[#00165F]">{t('wallet.history')}</h2>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: 'ALL',              label: t('wallet.filter.all') },
                  { key: 'DEPOSIT',          label: t('wallet.filter.deposits') },
                  { key: 'WITHDRAWAL',       label: t('wallet.filter.withdrawals') },
                  { key: 'CHALLENGE_DEBIT',  label: t('wallet.filter.challenges') },
                  { key: 'TEST_CREDIT',       label: '🧪 Test' },
                ].map(f => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      filter === f.key ? 'bg-[#0097FC] text-white' : 'dark:bg-white/10 bg-gray-100 dark:text-white/60 text-[#00165F]/60'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {txLoading && transactions.length === 0 ? (
            <div className="p-8 flex justify-center">
              <div className="w-6 h-6 border-2 border-[#0097FC]/30 border-t-[#0097FC] rounded-full animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center">
              <Wallet className="w-12 h-12 mx-auto dark:text-white/20 text-[#00165F]/20 mb-3" />
              <p className="dark:text-white/50 text-[#00165F]/50">{t('wallet.noTx')}</p>
            </div>
          ) : (
            <div className="divide-y dark:divide-white/5 divide-gray-100">
              {transactions.map((tx: any) => {
                const txColors = TX_TYPE_COLORS[tx.type] ?? { color: 'text-gray-400', icon: '·' };
                const txTypeLabels: Record<string, string> = {
                  DEPOSIT: t('wallet.tx.deposit'), WITHDRAWAL: t('wallet.tx.withdrawal'),
                  CHALLENGE_DEBIT: t('wallet.tx.challengeDebit'), CHALLENGE_CREDIT: t('wallet.tx.challengeCredit'),
                  CHALLENGE_ENTRY: t('wallet.tx.challengeDebit'), CHALLENGE_WIN: t('wallet.tx.challengeCredit'),
                  REFUND: t('wallet.tx.refund'), COMMISSION: t('wallet.tx.commission'),
                  DEBIT: t('wallet.tx.debit'), CREDIT: t('wallet.tx.credit'),
                  TEST_CREDIT: 'Crédit test',
                };
                const txStatusLabels: Record<string, string> = {
                  COMPLETED: t('wallet.status.completed'), PENDING: t('wallet.status.pending'),
                  FAILED: t('wallet.status.failed'), CANCELLED: t('wallet.status.cancelled'),
                };
                const typeInfo = { label: txTypeLabels[tx.type] ?? tx.type, ...txColors };
                const statusInfo = { label: txStatusLabels[tx.status] ?? tx.status, color: STATUS_COLORS[tx.status] ?? 'text-gray-400 bg-gray-400/10' };
                const isCredit = Number(tx.amount) > 0;
                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-3 px-4 sm:px-5 py-3 hover:dark:bg-white/5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-xl dark:bg-white/5 bg-gray-100 flex items-center justify-center text-base shrink-0">
                      {typeInfo.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold dark:text-white text-[#00165F] truncate">{tx.description || typeInfo.label}</p>
                      <p className="text-xs dark:text-white/40 text-[#00165F]/40 truncate">
                        {new Date(tx.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        {tx.paymentMethod && <span className="ml-2 opacity-60">· {tx.paymentMethod}</span>}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-black tabular-nums ${isCredit ? 'text-green-400' : 'text-red-400'}`}>
                        {isCredit ? '+' : ''}{formatSKY(Math.abs(Number(tx.amount)))}
                      </p>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${statusInfo.color}`}>{statusInfo.label}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Load more */}
          {transactions.length < total && (
            <div className="p-4 text-center border-t dark:border-white/5 border-gray-100">
              <button
                onClick={handleLoadMore}
                disabled={txLoading}
                className="px-6 py-2 rounded-xl text-sm font-semibold dark:bg-white/5 bg-gray-50 dark:text-white/70 text-[#00165F]/70 hover:text-[#0097FC] transition-colors disabled:opacity-50"
              >
                {txLoading ? t('wallet.loading') : `${t('wallet.loadMore')} (${total - transactions.length} ${t('wallet.remaining')})`}
              </button>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showDeposit && (
          <DepositModal onClose={() => setShowDeposit(false)} onSuccess={handleDepositSuccess} />
        )}
        {showWithdraw && (
          <WithdrawModal balance={balance} rewardBalance={rewardBalance} kycStatus={kycStatus} onClose={() => setShowWithdraw(false)} onSuccess={handleWithdrawSuccess} />
        )}
      </AnimatePresence>
    </div>
  );
}
