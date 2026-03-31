'use client';

import { useState } from 'react';
import { FileText, Download, CheckSquare, Square, Trophy, Users, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { formatSKY } from '@/lib/currency';
import { useAuthStore } from '@/lib/auth-store';
import { useI18n } from '@/components/i18n/I18nProvider';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const RULES_VERSION = 'v1.0';

function buildRulesHash(challenge: any): string {
  const content = `${challenge.title}-${challenge.type}-${challenge.entryFee}-${challenge.maxPlayers}-${challenge.commission}`;
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

interface ChallengeRulesProps {
  challenge: {
    id: string;
    title: string;
    game: string;
    type: string;
    entryFee: number;
    maxPlayers: number;
    potTotal: number;
    commission: number;
  };
  prizeFirst: number;
  onAccept: () => void;
  onCancel: () => void;
  actionLoading?: boolean;
}

export default function ChallengeRules({ challenge, prizeFirst, onAccept, onCancel, actionLoading }: ChallengeRulesProps) {
  const idToken = useAuthStore((s) => s.tokens?.idToken ?? '');
  const { t } = useI18n();
  const [accepted, setAccepted] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [submittingAcceptance, setSubmittingAcceptance] = useState(false);
  const rulesHash = buildRulesHash(challenge);

  const orgFee = Math.round(challenge.commission * 100);
  const TYPE_LABELS: Record<string, string> = {
    DUEL: 'Duel 1v1', SMALL_CHALLENGE: t('challenge.type.small'),
    STANDARD: t('challenge.type.standard'), MEDIUM_TOURNAMENT: t('challenge.type.medium'),
    BIG_TOURNAMENT: t('challenge.type.big'), PREMIUM_TOURNAMENT: t('challenge.type.premium'),
  };
  const typeLabel = TYPE_LABELS[challenge.type] ?? challenge.type;

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`${API}/challenges/${challenge.id}/rules.pdf`);
      if (!res.ok) throw new Error('PDF unavailable');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reglement-${challenge.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pb-20 sm:pb-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl dark:bg-[#001040] bg-white border dark:border-white/10 border-gray-200 shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b dark:border-white/10 border-gray-100 bg-gradient-to-r from-[#00165F] to-[#0055cc]">
          <FileText className="w-5 h-5 text-[#0097FC] shrink-0" />
          <div>
            <h2 className="font-black text-white text-base">{t('rules.title')}</h2>
            <p className="text-xs text-white/60 truncate">{challenge.title}</p>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3 max-h-[60vh] overflow-y-auto">

          {/* Info grid */}
          <div className="rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 divide-y dark:divide-white/8 divide-gray-200">
            {[
              { label: t('rules.organizer'), value: 'SKY PLAY ENTERTAINMENT' },
              { label: t('rules.type'), value: `${typeLabel} — ${challenge.game}` },
              { label: t('rules.entryFee'), value: `🪙 ${formatSKY(challenge.entryFee)}`, highlight: true },
              { label: t('rules.format'), value: challenge.maxPlayers === 2 ? t('rules.format.single') : `${challenge.maxPlayers} ${t('rules.format.players')}` },
              { label: t('rules.prize1st'), value: `🪙 ${formatSKY(prizeFirst)}`, highlight: true },
              { label: t('rules.orgFee'), value: `${formatSKY(Math.round(challenge.potTotal * challenge.commission))} (${orgFee}%)` },
            ].map(({ label, value, highlight }) => (
              <div key={label} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="dark:text-white/60 text-[#00165F]/60">{label}</span>
                <span className={`font-semibold ${highlight ? 'text-[#FD2E5F]' : 'dark:text-white text-[#00165F]'}`}>{value}</span>
              </div>
            ))}
          </div>

          {/* Critères */}
          <div className="rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 p-4 space-y-2">
            <div className="flex items-start gap-2">
              <Trophy className="w-4 h-4 text-[#0097FC] mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold dark:text-white text-[#00165F] mb-1">{t('rules.criteria.title')}</p>
                <p className="text-xs dark:text-white/60 text-[#00165F]/60">{t('rules.criteria.desc')}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold dark:text-white text-[#00165F] mb-1">{t('rules.deadline.title')}</p>
                <p className="text-xs dark:text-white/60 text-[#00165F]/60">{t('rules.deadline.desc')}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold dark:text-white text-[#00165F] mb-1">{t('rules.cancel.title')}</p>
                <p className="text-xs dark:text-white/60 text-[#00165F]/60">{t('rules.cancel.desc')}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Users className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold dark:text-white text-[#00165F] mb-1">{t('rules.legal.title')}</p>
                <p className="text-xs dark:text-white/60 text-[#00165F]/60">{t('rules.legal.desc')}</p>
              </div>
            </div>
          </div>

            {/* Métadonnées règlement */}
          <div className="flex items-center justify-between rounded-xl dark:bg-white/5 bg-gray-50 px-3 py-2">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-[#0097FC]" />
              <span className="text-[10px] dark:text-white/40 text-[#00165F]/40">{t('rules.version')} <strong>{RULES_VERSION}</strong></span>
            </div>
            <span className="text-[10px] dark:text-white/30 text-[#00165F]/30 font-mono">#{rulesHash}</span>
          </div>

          {/* Politique de remboursement */}
          <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-3 space-y-1.5">
            <p className="text-xs font-bold text-yellow-400 flex items-center gap-1.5">{t('rules.refund.title')}</p>
            <ul className="text-[10px] dark:text-white/50 text-[#00165F]/50 space-y-0.5 list-disc list-inside">
              <li>{t('rules.refund.1')}</li>
              <li>{t('rules.refund.2')}</li>
              <li>{t('rules.refund.3')}</li>
              <li>{t('rules.refund.4')}</li>
              <li>{t('rules.refund.5')}</li>
              <li>{t('rules.refund.6')}</li>
            </ul>
          </div>

          {/* Note légale discrète */}
          <p className="text-[10px] dark:text-white/30 text-[#00165F]/30 text-center leading-relaxed">
            {t('rules.legal.note')}
          </p>

          {/* Download PDF */}
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border dark:border-[#0097FC]/40 border-[#0097FC]/60 text-[#0097FC] text-sm font-semibold hover:dark:bg-[#0097FC]/10 hover:bg-[#0097FC]/5 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {downloading ? t('rules.downloading') : t('rules.download')}
          </button>

          {/* Checkbox */}
          <button
            onClick={() => setAccepted(v => !v)}
            className="flex items-center gap-3 w-full text-left"
          >
            {accepted
              ? <CheckSquare className="w-5 h-5 text-[#0097FC] shrink-0" />
              : <Square className="w-5 h-5 dark:text-white/40 text-[#00165F]/40 shrink-0" />}
            <span className="text-sm dark:text-white/80 text-[#00165F]/80">
              {t('rules.accept')}
            </span>
          </button>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t dark:border-white/10 border-gray-100 flex flex-col sm:flex-row gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border dark:border-white/20 border-gray-300 text-sm font-semibold dark:text-white/70 text-[#00165F]/70 hover:dark:bg-white/5 hover:bg-gray-50 transition-colors"
          >
            {t('rules.cancel.btn')}
          </button>
          <button
            onClick={async () => {
              if (!accepted || !idToken) return;
              setSubmittingAcceptance(true);
              try {
                await fetch(`${API}/challenges/${challenge.id}/accept-rules`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
                  body: JSON.stringify({ rulesVersion: RULES_VERSION, rulesHash }),
                });
              } catch {}
              finally { setSubmittingAcceptance(false); }
              onAccept();
            }}
            disabled={!accepted || actionLoading || submittingAcceptance}
            className="flex-1 py-2.5 rounded-xl bg-[#0097FC] text-white text-sm font-black hover:bg-[#0097FC]/90 transition-all hover:scale-[1.02] disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed"
          >
            {actionLoading || submittingAcceptance
              ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {t('rules.joining')}</span>
              : t('rules.join.btn')}
          </button>
        </div>
      </div>
    </div>
  );
}
