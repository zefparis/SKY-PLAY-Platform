'use client';

import { useEffect, useState } from 'react';
import { ShieldAlert, ShieldX, ShieldCheck, Monitor, RefreshCw, X, Ban, ChevronDown, ChevronUp, Clock, Wifi } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type Alert = {
  id: string;
  action: string;
  targetId: string;
  details: any;
  createdAt: string;
};

type FlaggedDevice = {
  id: string;
  userId: string;
  fingerprint: string;
  userAgent?: string;
  ipAddress?: string;
  firstSeenAt: string;
  lastSeenAt: string;
  flagReason?: string;
  user: { id: string; username: string; email: string; avatar?: string; isBanned: boolean };
};

type Stats = {
  totalDevices: number;
  flaggedDevices: number;
  multiAccountAlerts: number;
  ipAlerts: number;
  pendingWinnings: number;
};

const ACTION_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  MULTI_ACCOUNT_DETECTED:    { label: 'Multi-compte', color: 'text-red-400',    bg: 'bg-red-400/10',    icon: ShieldAlert },
  IP_MULTI_ACCOUNT_SOFT_FLAG:{ label: 'IP suspecte',  color: 'text-orange-400', bg: 'bg-orange-400/10', icon: Wifi },
  WINNINGS_PENDING_REVIEW:   { label: 'Gains bloqués',color: 'text-yellow-400', bg: 'bg-yellow-400/10', icon: Clock },
};

export default function SecurityAdminPage() {
  const idToken = useAuthStore((s) => s.tokens?.idToken);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [devices, setDevices] = useState<FlaggedDevice[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'alerts' | 'devices'>('alerts');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const headers = { Authorization: `Bearer ${idToken}` };

  const fetchAll = async () => {
    if (!idToken) return;
    setLoading(true);
    try {
      const [alertsRes, devicesRes, statsRes] = await Promise.all([
        fetch(`${API}/admin/security/alerts`, { headers }).then(r => r.json()),
        fetch(`${API}/admin/security/devices/flagged`, { headers }).then(r => r.json()),
        fetch(`${API}/admin/security/stats`, { headers }).then(r => r.json()),
      ]);
      setAlerts(Array.isArray(alertsRes) ? alertsRes : []);
      setDevices(Array.isArray(devicesRes) ? devicesRes : []);
      setStats(statsRes?.totalDevices !== undefined ? statsRes : null);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [idToken]);

  const notify = (msg: string) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(''), 4000);
  };

  const handleUnflag = async (deviceId: string) => {
    setActionLoading(deviceId);
    try {
      const res = await fetch(`${API}/admin/security/devices/${deviceId}/unflag`, { method: 'POST', headers });
      if (!res.ok) throw new Error('Erreur');
      notify('✅ Device dé-signalé (faux positif validé)');
      fetchAll();
    } catch { notify('❌ Erreur lors du dé-signalement'); }
    setActionLoading(null);
  };

  const handleBanAll = async (fingerprint: string) => {
    if (!confirm('Bannir TOUS les comptes liés à ce device ?')) return;
    setActionLoading(fingerprint);
    try {
      const res = await fetch(`${API}/admin/security/fingerprint/${encodeURIComponent(fingerprint)}/ban-all`, { method: 'POST', headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      notify(`🚫 ${data.banned} comptes bannis`);
      fetchAll();
    } catch (e: any) { notify(`❌ ${e.message}`); }
    setActionLoading(null);
  };

  const multiAccountAlerts = alerts.filter(a => a.action === 'MULTI_ACCOUNT_DETECTED');
  const ipAlerts = alerts.filter(a => a.action === 'IP_MULTI_ACCOUNT_SOFT_FLAG');
  const winningsAlerts = alerts.filter(a => a.action === 'WINNINGS_PENDING_REVIEW');

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black dark:text-white text-[#00165F]">🚨 Sécurité</h1>
          <p className="text-sm dark:text-white/60 text-[#00165F]/60">Anti multi-comptes & device fingerprint</p>
        </div>
        <button onClick={fetchAll} className="p-2 rounded-xl dark:bg-white/10 bg-white border dark:border-white/10 border-gray-200 dark:text-white text-[#00165F]">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {actionMsg && (
        <div className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">{actionMsg}</div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Devices total', value: stats.totalDevices, color: 'text-[#0097FC]' },
            { label: 'Devices flaggés', value: stats.flaggedDevices, color: 'text-red-400' },
            { label: 'Multi-comptes', value: stats.multiAccountAlerts, color: 'text-red-400' },
            { label: 'IPs suspectes', value: stats.ipAlerts, color: 'text-orange-400' },
            { label: 'Gains bloqués', value: stats.pendingWinnings, color: 'text-yellow-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl dark:bg-white/5 bg-white border dark:border-white/10 border-gray-100 p-4 text-center">
              <p className={`text-2xl font-black ${color}`}>{value}</p>
              <p className="text-xs dark:text-white/50 text-[#00165F]/50 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { key: 'alerts', label: `🚨 Alertes (${alerts.length})` },
          { key: 'devices', label: `🖥️ Devices flaggés (${devices.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
              tab === t.key ? 'bg-[#0097FC] text-white' : 'dark:bg-white/10 bg-white border dark:border-white/10 border-gray-200 dark:text-white/70 text-[#00165F]/70'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-[#0097FC]/30 border-t-[#0097FC] rounded-full animate-spin" />
        </div>
      ) : tab === 'alerts' ? (
        /* ─── ALERTS TAB ─── */
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl dark:bg-white/5 bg-white border dark:border-white/10 border-gray-100">
              <ShieldCheck className="w-10 h-10 dark:text-white/20 text-[#00165F]/20" />
              <p className="text-sm dark:text-white/50 text-[#00165F]/50">Aucune alerte de sécurité</p>
            </div>
          ) : (
            <>
              {/* Group by type */}
              {[
                { title: '🔴 Multi-comptes détectés', items: multiAccountAlerts, type: 'MULTI_ACCOUNT_DETECTED' },
                { title: '🟠 IPs suspectes', items: ipAlerts, type: 'IP_MULTI_ACCOUNT_SOFT_FLAG' },
                { title: '🟡 Gains en attente de validation', items: winningsAlerts, type: 'WINNINGS_PENDING_REVIEW' },
              ].filter(g => g.items.length > 0).map(group => (
                <div key={group.type} className="rounded-2xl dark:bg-white/5 bg-white border dark:border-white/10 border-gray-100 overflow-hidden">
                  <div className="px-5 py-3 dark:bg-[#00165F]/30 bg-gray-50 border-b dark:border-white/10 border-gray-100">
                    <p className="text-sm font-bold dark:text-white text-[#00165F]">{group.title} — {group.items.length}</p>
                  </div>
                  <div className="divide-y dark:divide-white/5 divide-gray-100">
                    {group.items.map(alert => {
                      const cfg = ACTION_CONFIG[alert.action];
                      const Icon = cfg?.icon ?? ShieldAlert;
                      const isOpen = expanded === alert.id;
                      return (
                        <div key={alert.id}>
                          <button
                            onClick={() => setExpanded(isOpen ? null : alert.id)}
                            className="w-full flex items-center gap-3 px-5 py-3 hover:dark:bg-white/5 hover:bg-gray-50 transition text-left"
                          >
                            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-full ${cfg?.color ?? 'text-red-400'} ${cfg?.bg ?? 'bg-red-400/10'}`}>
                              <Icon className="w-3 h-3" />
                              {cfg?.label ?? alert.action}
                            </span>
                            <span className="text-xs dark:text-white/50 text-[#00165F]/50 flex-1">
                              Cible: {alert.targetId?.slice(0, 8)}…
                            </span>
                            <span className="text-xs dark:text-white/30 text-[#00165F]/30">
                              {new Date(alert.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isOpen ? <ChevronUp className="w-4 h-4 dark:text-white/30 text-[#00165F]/30 shrink-0" /> : <ChevronDown className="w-4 h-4 dark:text-white/30 text-[#00165F]/30 shrink-0" />}
                          </button>
                          {isOpen && (
                            <div className="px-5 pb-4 dark:bg-[#00165F]/10 bg-gray-50">
                              <pre className="text-xs dark:text-white/60 text-[#00165F]/60 bg-black/10 dark:bg-black/20 rounded-xl p-3 overflow-x-auto whitespace-pre-wrap">
                                {JSON.stringify(alert.details, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      ) : (
        /* ─── DEVICES TAB ─── */
        <div className="rounded-2xl dark:bg-white/5 bg-white border dark:border-white/10 border-gray-100 overflow-hidden">
          {devices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Monitor className="w-10 h-10 dark:text-white/20 text-[#00165F]/20" />
              <p className="text-sm dark:text-white/50 text-[#00165F]/50">Aucun device flaggé</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead className="dark:bg-[#00165F]/40 bg-gray-50 border-b dark:border-white/10 border-gray-100">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase">Utilisateur</th>
                    <th className="px-5 py-3 text-left text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase">Fingerprint</th>
                    <th className="px-5 py-3 text-left text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase hidden md:table-cell">IP</th>
                    <th className="px-5 py-3 text-left text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase hidden lg:table-cell">Raison</th>
                    <th className="px-5 py-3 text-left text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase hidden lg:table-cell">Dernière activité</th>
                    <th className="px-5 py-3 text-left text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-white/5 divide-gray-100">
                  {devices.map(device => (
                    <tr key={device.id} className="dark:hover:bg-white/5 hover:bg-gray-50 transition">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          {device.user.avatar
                            ? <img src={device.user.avatar} alt={device.user.username} className="w-8 h-8 rounded-full shrink-0" />
                            : <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0097FC] to-[#003399] flex items-center justify-center text-white font-bold text-xs shrink-0">{device.user.username?.[0]?.toUpperCase()}</div>}
                          <div>
                            <p className="text-sm font-semibold dark:text-white text-[#00165F] flex items-center gap-1.5">
                              {device.user.username}
                              {device.user.isBanned && <span className="text-xs text-red-400 font-bold">Banni</span>}
                            </p>
                            <p className="text-xs dark:text-white/40 text-[#00165F]/40">{device.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <code className="text-xs dark:text-white/60 text-[#00165F]/60 font-mono">{device.fingerprint.slice(0, 12)}…</code>
                      </td>
                      <td className="px-5 py-3 hidden md:table-cell">
                        <span className="text-xs dark:text-white/50 text-[#00165F]/50">{device.ipAddress ?? '—'}</span>
                      </td>
                      <td className="px-5 py-3 hidden lg:table-cell">
                        <span className="text-xs text-red-400 font-semibold">{device.flagReason ?? '—'}</span>
                      </td>
                      <td className="px-5 py-3 hidden lg:table-cell">
                        <span className="text-xs dark:text-white/50 text-[#00165F]/50">
                          {new Date(device.lastSeenAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUnflag(device.id)}
                            disabled={actionLoading === device.id}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-400/15 text-emerald-400 hover:bg-emerald-400/25 transition disabled:opacity-50"
                            title="Faux positif — dé-signaler"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            OK
                          </button>
                          {!device.user.isBanned && (
                            <button
                              onClick={() => handleBanAll(device.fingerprint)}
                              disabled={actionLoading === device.fingerprint}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-red-400/15 text-red-400 hover:bg-red-400/25 transition disabled:opacity-50"
                              title="Bannir tous les comptes liés"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              Bannir tous
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
