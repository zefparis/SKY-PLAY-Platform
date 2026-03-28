'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, X, ChevronDown, ExternalLink } from 'lucide-react';
import { formatCFA } from '@/lib/currency';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function getToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token') || '';
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'En attente', color: 'text-orange-400 bg-orange-400/10' },
  REVIEWING: { label: 'En examen', color: 'text-blue-400 bg-blue-400/10' },
  RESOLVED: { label: 'Résolu', color: 'text-green-400 bg-green-400/10' },
};

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [winnerId, setWinnerId] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [resolveLoading, setResolveLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API}/admin/challenges/disputes`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Accès refusé');
      const data = await res.json();
      setDisputes(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openDispute = async (disputeId: string) => {
    try {
      const res = await fetch(`${API}/admin/challenges/disputes/${disputeId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      setSelected(data);
      setWinnerId('');
      setAdminNote('');
    } catch {}
  };

  const resolveDispute = async () => {
    if (!selected || !winnerId || !adminNote) return;
    setResolveLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/admin/challenges/disputes/${selected.id}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ winnerId, adminNote }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erreur');
      }
      setSelected(null);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setResolveLoading(false);
    }
  };

  return (
    <div className="min-h-screen dark:bg-[#00165F]/5 bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-start sm:items-center justify-between gap-3 mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-black dark:text-white text-[#00165F] flex items-center gap-2 sm:gap-3">
              <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7 text-[#FD2E5F] shrink-0" />
              Litiges — Admin
            </h1>
            <p className="dark:text-white/50 text-[#00165F]/50 text-sm mt-1">
              {disputes.filter(d => d.status === 'PENDING').length} litige(s) en attente
            </p>
          </div>
          <button
            onClick={load}
            className="shrink-0 text-xs px-3 py-1.5 rounded-lg dark:bg-white/10 bg-white dark:text-white text-[#00165F] border dark:border-white/10 border-gray-200"
          >
            Actualiser
          </button>
        </div>

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-red-400 text-sm mb-6">
            {error}
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl dark:bg-white/5 bg-white animate-pulse" />
            ))}
          </div>
        ) : disputes.length === 0 ? (
          <div className="text-center py-20">
            <CheckCircle className="w-16 h-16 mx-auto text-green-400/30 mb-4" />
            <p className="dark:text-white/50 text-[#00165F]/50">Aucun litige pour le moment</p>
          </div>
        ) : (
          <div className="rounded-2xl dark:bg-white/5 bg-white border dark:border-white/10 border-gray-100 overflow-hidden">
            <table className="w-full text-sm min-w-0">
              <thead>
                <tr className="border-b dark:border-white/10 border-gray-100">
                  <th className="text-left px-3 sm:px-4 py-3 dark:text-white/50 text-[#00165F]/50 font-medium">Défi</th>
                  <th className="text-left px-3 sm:px-4 py-3 dark:text-white/50 text-[#00165F]/50 font-medium hidden sm:table-cell">Joueurs</th>
                  <th className="text-left px-3 sm:px-4 py-3 dark:text-white/50 text-[#00165F]/50 font-medium hidden md:table-cell">Raison</th>
                  <th className="text-left px-3 sm:px-4 py-3 dark:text-white/50 text-[#00165F]/50 font-medium hidden md:table-cell">Date</th>
                  <th className="text-left px-3 sm:px-4 py-3 dark:text-white/50 text-[#00165F]/50 font-medium">Statut</th>
                  <th className="px-3 sm:px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {disputes.map((dispute) => {
                  const statusInfo = STATUS_LABELS[dispute.status] ?? { label: dispute.status, color: 'text-gray-400 bg-gray-400/10' };
                  return (
                    <tr key={dispute.id} className="border-b dark:border-white/5 border-gray-50 last:border-0 hover:dark:bg-white/5 hover:bg-gray-50">
                      <td className="px-3 sm:px-4 py-3">
                        <p className="font-semibold dark:text-white text-[#00165F] truncate max-w-[120px] sm:max-w-[200px]">
                          {dispute.challenge?.title}
                        </p>
                        <p className="text-xs dark:text-white/40 text-[#00165F]/40">{dispute.challenge?.game}</p>
                      </td>
                      <td className="px-3 sm:px-4 py-3 hidden sm:table-cell">
                        <span className="dark:text-white/60 text-[#00165F]/60">
                          {dispute.challenge?.participants?.length ?? 0} joueurs
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 py-3 hidden md:table-cell">
                        <span className="dark:text-white/60 text-[#00165F]/60 truncate max-w-[180px] block">
                          {dispute.reason}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 py-3 hidden md:table-cell">
                        <span className="text-xs dark:text-white/40 text-[#00165F]/40">
                          {new Date(dispute.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-right">
                        {dispute.status !== 'RESOLVED' && (
                          <button
                            onClick={() => openDispute(dispute.id)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-[#0097FC]/20 text-[#0097FC] hover:bg-[#0097FC]/30 font-medium transition-colors"
                          >
                            Examiner
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Resolve Modal */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg dark:bg-[#00165F] bg-white rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[95dvh] sm:max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-4 sm:p-5 border-b dark:border-white/10 border-gray-100 shrink-0">
                <h3 className="font-black dark:text-white text-[#00165F]">
                  Résoudre le litige
                </h3>
                <button onClick={() => setSelected(null)} className="dark:text-white/50 text-[#00165F]/50 hover:text-[#FD2E5F] p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
                {/* Challenge info */}
                <div className="rounded-xl dark:bg-white/5 bg-gray-50 p-4">
                  <p className="font-semibold dark:text-white text-[#00165F]">{selected.challenge?.title}</p>
                  <p className="text-sm dark:text-white/50 text-[#00165F]/50">{selected.challenge?.game}</p>
                  <p className="text-sm text-[#FD2E5F] mt-1">Raison: {selected.reason}</p>
                </div>

                {/* Declarations */}
                <div>
                  <p className="text-xs font-semibold dark:text-white/50 text-[#00165F]/50 uppercase tracking-wide mb-2">Déclarations</p>
                  <div className="space-y-2">
                    {selected.challenge?.results?.map((r: any) => (
                      <div key={r.id} className="flex items-center justify-between p-3 rounded-lg dark:bg-white/5 bg-gray-50">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold dark:text-white text-[#00165F]">{r.user?.username}</span>
                          <span className="text-xs dark:text-white/50 text-[#00165F]/50">→ rang #{r.declaredRank}</span>
                        </div>
                        {r.screenshotUrl && (
                          <a href={r.screenshotUrl} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-[#0097FC] flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" /> Screenshot
                          </a>
                        )}
                      </div>
                    ))}
                    {(!selected.challenge?.results || selected.challenge.results.length === 0) && (
                      <p className="text-sm dark:text-white/40 text-[#00165F]/40">Aucune déclaration soumise</p>
                    )}
                  </div>
                </div>

                {/* Select winner */}
                <div>
                  <p className="text-xs font-semibold dark:text-white/50 text-[#00165F]/50 uppercase tracking-wide mb-2">Désigner le gagnant</p>
                  <div className="grid grid-cols-2 gap-2">
                    {selected.challenge?.participants?.map((p: any) => (
                      <button
                        key={p.userId}
                        onClick={() => setWinnerId(p.userId)}
                        className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                          winnerId === p.userId
                            ? 'border-[#0097FC] bg-[#0097FC]/10 dark:text-white text-[#00165F]'
                            : 'border-transparent dark:bg-white/5 bg-gray-50 dark:text-white/60 text-[#00165F]/60'
                        }`}
                      >
                        {p.user?.username}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Admin note */}
                <div>
                  <p className="text-xs font-semibold dark:text-white/50 text-[#00165F]/50 uppercase tracking-wide mb-2">Note admin</p>
                  <textarea
                    value={adminNote}
                    onChange={e => setAdminNote(e.target.value)}
                    rows={3}
                    placeholder="Explication de la décision..."
                    className="w-full px-4 py-2.5 rounded-xl dark:bg-white/10 bg-gray-50 dark:text-white text-[#00165F] border dark:border-white/10 border-gray-200 focus:outline-none focus:border-[#0097FC] text-sm resize-none"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-500 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
                )}
              </div>

              <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-3 border-t dark:border-white/10 border-gray-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 shrink-0">
                <button onClick={() => setSelected(null)} className="px-4 py-2 rounded-xl dark:bg-white/10 bg-gray-100 dark:text-white text-[#00165F] text-sm font-medium">
                  Annuler
                </button>
                <button
                  onClick={resolveDispute}
                  disabled={!winnerId || !adminNote || resolveLoading}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#0097FC] text-white font-bold text-sm disabled:opacity-40 hover:bg-[#0097FC]/90"
                >
                  {resolveLoading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Résoudre le litige
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
