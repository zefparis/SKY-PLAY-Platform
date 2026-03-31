'use client';

import { useState } from 'react';
import { FileText, Download, CheckSquare, Square, Trophy, Users, Clock, AlertTriangle } from 'lucide-react';
import { formatSKY } from '@/lib/currency';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

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

const TYPE_LABELS: Record<string, string> = {
  DUEL: 'Duel Classé 1v1',
  SMALL_CHALLENGE: 'Petit Challenge',
  STANDARD: 'Challenge Standard',
  MEDIUM_TOURNAMENT: 'Tournoi Moyen',
  BIG_TOURNAMENT: 'Grand Tournoi',
  PREMIUM_TOURNAMENT: 'Tournoi Premium',
};

export default function ChallengeRules({ challenge, prizeFirst, onAccept, onCancel, actionLoading }: ChallengeRulesProps) {
  const [accepted, setAccepted] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const orgFee = Math.round(challenge.commission * 100);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl dark:bg-[#001040] bg-white border dark:border-white/10 border-gray-200 shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b dark:border-white/10 border-gray-100 bg-gradient-to-r from-[#00165F] to-[#0055cc]">
          <FileText className="w-5 h-5 text-[#0097FC] shrink-0" />
          <div>
            <h2 className="font-black text-white text-base">📋 RÈGLEMENT DE LA COMPÉTITION</h2>
            <p className="text-xs text-white/60 truncate">{challenge.title}</p>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3 max-h-[60vh] overflow-y-auto">

          {/* Info grid */}
          <div className="rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/8 border-gray-200 divide-y dark:divide-white/8 divide-gray-200">
            {[
              { label: 'Organisateur', value: 'SKY PLAY ENTERTAINMENT' },
              { label: 'Type', value: `${typeLabel} — ${challenge.game}` },
              { label: "Frais d'inscription", value: `🪙 ${formatSKY(challenge.entryFee)}`, highlight: true },
              { label: 'Format', value: challenge.maxPlayers === 2 ? 'Match unique' : `${challenge.maxPlayers} joueurs` },
              { label: 'Prime de performance 1er', value: `🪙 ${formatSKY(prizeFirst)}`, highlight: true },
              { label: "Frais d'organisation", value: `${formatSKY(Math.round(challenge.potTotal * challenge.commission))} (${orgFee}%)` },
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
                <p className="text-xs font-bold dark:text-white text-[#00165F] mb-1">Critères de victoire</p>
                <p className="text-xs dark:text-white/60 text-[#00165F]/60">Score le plus élevé déclaré + capture d'écran obligatoire.</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold dark:text-white text-[#00165F] mb-1">Délai de contestation</p>
                <p className="text-xs dark:text-white/60 text-[#00165F]/60">30 minutes après la déclaration du résultat.</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold dark:text-white text-[#00165F] mb-1">Conditions d'annulation</p>
                <p className="text-xs dark:text-white/60 text-[#00165F]/60">Remboursement intégral du pass si la compétition n'est pas complétée sous 24h.</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Users className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold dark:text-white text-[#00165F] mb-1">Mention légale</p>
                <p className="text-xs dark:text-white/60 text-[#00165F]/60">Compétition fondée sur l'habileté. SKY PLAY ENTERTAINMENT — Cameroun.</p>
              </div>
            </div>
          </div>

          {/* Note légale discrète */}
          <p className="text-[10px] dark:text-white/30 text-[#00165F]/30 text-center leading-relaxed">
            (1 SKY = 1 CFA — conversion lors du retrait · Sky Credits non convertibles en dehors de la plateforme)
          </p>

          {/* Download PDF */}
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border dark:border-[#0097FC]/40 border-[#0097FC]/60 text-[#0097FC] text-sm font-semibold hover:dark:bg-[#0097FC]/10 hover:bg-[#0097FC]/5 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {downloading ? 'Téléchargement...' : '📥 Télécharger le règlement PDF'}
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
              J'ai lu et j'accepte le règlement officiel de cette compétition.
            </span>
          </button>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t dark:border-white/10 border-gray-100 flex flex-col sm:flex-row gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border dark:border-white/20 border-gray-300 text-sm font-semibold dark:text-white/70 text-[#00165F]/70 hover:dark:bg-white/5 hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onAccept}
            disabled={!accepted || actionLoading}
            className="flex-1 py-2.5 rounded-xl bg-[#0097FC] text-white text-sm font-black hover:bg-[#0097FC]/90 transition-all hover:scale-[1.02] disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed"
          >
            {actionLoading
              ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Inscription...</span>
              : "S'inscrire à la compétition"}
          </button>
        </div>
      </div>
    </div>
  );
}
