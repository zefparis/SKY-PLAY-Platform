'use client';

import { useEffect, useState } from 'react';
import { Shield, ShieldX, Clock, RefreshCw, X, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type ExcludedUser = {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  exclusionStatus: string;
  exclusionUntil?: string;
  exclusionReason?: string;
  exclusionRequestedAt?: string;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  COOLING_OFF:           { label: 'Pause',        color: 'text-orange-400', bg: 'bg-orange-400/10' },
  SELF_EXCLUDED:         { label: 'Auto-exclusion', color: 'text-red-400',   bg: 'bg-red-400/10' },
  PERMANENTLY_EXCLUDED:  { label: 'Définitif',     color: 'text-red-600',   bg: 'bg-red-600/10' },
};

export default function ExclusionsAdminPage() {
  const idToken = useAuthStore((s) => s.tokens?.idToken);
  const [users, setUsers] = useState<ExcludedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [reactivateUser, setReactivateUser] = useState<ExcludedUser | null>(null);
  const [justification, setJustification] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  const fetchExclusions = async () => {
    if (!idToken) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/exclusions`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchExclusions(); }, [idToken]);

  const handleReactivate = async () => {
    if (!reactivateUser || !idToken || !justification.trim()) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/admin/users/${reactivateUser.id}/reactivate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ justification }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setReactivateUser(null);
      setJustification('');
      setActionMsg(`✅ Compte de ${reactivateUser.username} réactivé.`);
      fetchExclusions();
    } catch (e: any) {
      setActionMsg(`❌ ${e.message}`);
    } finally {
      setActionLoading(false);
      setTimeout(() => setActionMsg(''), 4000);
    }
  };

  const filtered = filterStatus
    ? users.filter(u => u.exclusionStatus === filterStatus)
    : users;

  const stats = {
    total: users.length,
    cooling: users.filter(u => u.exclusionStatus === 'COOLING_OFF').length,
    excluded: users.filter(u => u.exclusionStatus === 'SELF_EXCLUDED').length,
    permanent: users.filter(u => u.exclusionStatus === 'PERMANENTLY_EXCLUDED').length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black dark:text-white text-[#00165F]">Auto-exclusions</h1>
          <p className="text-sm dark:text-white/60 text-[#00165F]/60">{stats.total} compte(s) concerné(s)</p>
        </div>
        <button onClick={fetchExclusions} className="p-2 rounded-xl dark:bg-white/10 bg-white border dark:border-white/10 border-gray-200 dark:text-white text-[#00165F]">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pauses actives', value: stats.cooling, color: 'text-orange-400' },
          { label: 'Auto-exclusions', value: stats.excluded, color: 'text-red-400' },
          { label: 'Définitifs', value: stats.permanent, color: 'text-red-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl dark:bg-white/5 bg-white border dark:border-white/10 border-gray-100 p-4 text-center">
            <p className={`text-2xl font-black ${color}`}>{value}</p>
            <p className="text-xs dark:text-white/50 text-[#00165F]/50 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {actionMsg && (
        <div className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">{actionMsg}</div>
      )}

      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: '', label: 'Tous' },
          { key: 'COOLING_OFF', label: '⏸️ Pauses' },
          { key: 'SELF_EXCLUDED', label: '🔒 Auto-exclusions' },
          { key: 'PERMANENTLY_EXCLUDED', label: '🚫 Définitifs' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilterStatus(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterStatus === f.key ? 'bg-[#0097FC] text-white' : 'dark:bg-white/10 bg-white border dark:border-white/10 border-gray-200 dark:text-white/70 text-[#00165F]/70'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl dark:bg-white/5 bg-white border dark:border-white/10 border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#0097FC]/30 border-t-[#0097FC] rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Shield className="w-10 h-10 dark:text-white/20 text-[#00165F]/20" />
            <p className="text-sm dark:text-white/50 text-[#00165F]/50">Aucun compte exclu</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="dark:bg-[#00165F]/40 bg-gray-50 border-b dark:border-white/10 border-gray-100">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase">Utilisateur</th>
                  <th className="px-5 py-3 text-left text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase">Statut</th>
                  <th className="px-5 py-3 text-left text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase hidden md:table-cell">Fin</th>
                  <th className="px-5 py-3 text-left text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase hidden lg:table-cell">Raison</th>
                  <th className="px-5 py-3 text-left text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-white/5 divide-gray-100">
                {filtered.map(u => {
                  const cfg = STATUS_CONFIG[u.exclusionStatus] ?? { label: u.exclusionStatus, color: 'text-gray-400', bg: 'bg-gray-400/10' };
                  return (
                    <tr key={u.id} className="dark:hover:bg-white/5 hover:bg-gray-50 transition">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          {u.avatar
                            ? <img src={u.avatar} alt={u.username} className="w-8 h-8 rounded-full shrink-0" />
                            : <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0097FC] to-[#003399] flex items-center justify-center text-white font-bold text-xs shrink-0">{u.username[0]?.toUpperCase()}</div>}
                          <div>
                            <p className="text-sm font-semibold dark:text-white text-[#00165F]">{u.username}</p>
                            <p className="text-xs dark:text-white/40 text-[#00165F]/40">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${cfg.color} ${cfg.bg}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 hidden md:table-cell">
                        {u.exclusionUntil
                          ? <span className="text-xs dark:text-white/60 text-[#00165F]/60 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(u.exclusionUntil).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          : <span className="text-xs text-red-400 font-semibold">Définitif</span>}
                      </td>
                      <td className="px-5 py-3 hidden lg:table-cell">
                        <span className="text-xs dark:text-white/50 text-[#00165F]/50 line-clamp-1 max-w-[150px]">{u.exclusionReason ?? '—'}</span>
                      </td>
                      <td className="px-5 py-3">
                        {u.exclusionStatus !== 'PERMANENTLY_EXCLUDED' && (
                          <button
                            onClick={() => { setReactivateUser(u); setJustification(''); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-400/15 text-emerald-400 hover:bg-emerald-400/25 transition"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Réactiver
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

      {/* Reactivation Modal */}
      {reactivateUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#00165F] rounded-2xl p-6 max-w-md w-full border dark:border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black dark:text-white text-[#00165F]">
                Réactiver — {reactivateUser.username}
              </h3>
              <button onClick={() => setReactivateUser(null)} className="dark:text-white/50 hover:text-red-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="rounded-xl bg-yellow-400/5 border border-yellow-400/20 p-3 mb-4">
              <p className="text-xs text-yellow-400 font-semibold">⚠️ La réactivation ne doit être effectuée qu'en cas d'erreur avérée.</p>
            </div>
            <label className="block text-sm font-semibold dark:text-white/60 text-[#00165F]/60 mb-2">
              Justification obligatoire *
            </label>
            <textarea
              value={justification}
              onChange={e => setJustification(e.target.value)}
              rows={3}
              placeholder="Erreur technique, demande incorrecte..."
              className="w-full px-4 py-3 rounded-xl dark:bg-white/10 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-[#00165F] text-sm focus:outline-none focus:border-[#0097FC] resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setReactivateUser(null)}
                className="flex-1 py-2.5 rounded-xl dark:bg-white/10 bg-gray-100 dark:text-white text-[#00165F] font-semibold text-sm">
                Annuler
              </button>
              <button onClick={handleReactivate} disabled={!justification.trim() || actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-sm disabled:opacity-50 hover:bg-emerald-600 transition flex items-center justify-center gap-2">
                {actionLoading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
