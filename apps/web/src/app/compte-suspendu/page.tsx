'use client';

import { useEffect, useState } from 'react';
import { Lock, XCircle, LogOut } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function CompteSuspenduPage() {
  const idToken = useAuthStore((s) => s.tokens?.idToken ?? '');
  const logout = useAuthStore((s) => s.logout);
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    if (!idToken) return;
    fetch(`${API}/users/self-exclude/status`, {
      headers: { Authorization: `Bearer ${idToken}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setStatus(data); })
      .catch(() => {});
  }, [idToken]);

  const isPermanent = status?.exclusionStatus === 'PERMANENTLY_EXCLUDED';
  const exclusionUntil = status?.exclusionUntil ? new Date(status.exclusionUntil) : null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 dark:bg-[#00165F]/5 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="rounded-2xl dark:bg-[#001040] bg-white border dark:border-white/10 border-gray-200 shadow-2xl p-8 text-center space-y-5">

          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${
            isPermanent ? 'bg-red-400/15' : 'bg-orange-400/15'
          }`}>
            {isPermanent
              ? <XCircle className="w-10 h-10 text-red-400" />
              : <Lock className="w-10 h-10 text-orange-400" />
            }
          </div>

          <div>
            <h1 className="text-2xl font-black dark:text-white text-[#00165F] mb-2">
              🔒 Compte suspendu
            </h1>

            {isPermanent ? (
              <p className="text-sm dark:text-white/70 text-[#00165F]/70">
                Votre compte a été <strong>définitivement fermé</strong>.
              </p>
            ) : (
              <div className="space-y-1">
                <p className="text-sm dark:text-white/70 text-[#00165F]/70">
                  Votre compte est suspendu jusqu'au
                </p>
                {exclusionUntil && (
                  <p className="text-base font-black dark:text-white text-[#00165F]">
                    {exclusionUntil.toLocaleDateString('fr-FR', {
                      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                )}
              </div>
            )}
          </div>

          {status?.exclusionRequestedAt && (
            <p className="text-xs dark:text-white/40 text-[#00165F]/40">
              Suspension activée à votre demande le{' '}
              {new Date(status.exclusionRequestedAt).toLocaleDateString('fr-FR', {
                day: '2-digit', month: 'long', year: 'numeric',
              })}
            </p>
          )}

          <div className="rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-white/10 border-gray-200 p-4 text-left text-xs dark:text-white/60 text-[#00165F]/60 space-y-1">
            <p className="font-semibold dark:text-white text-[#00165F] mb-1.5">
              Si vous pensez qu'il s'agit d'une erreur :
            </p>
            <p>Contactez notre équipe support :</p>
            <a href="mailto:support@skyplay.cm" className="text-[#0097FC] font-bold hover:underline">
              support@skyplay.cm
            </a>
          </div>

          <button
            onClick={() => logout?.()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border dark:border-white/20 border-gray-300 text-sm font-semibold dark:text-white/70 text-[#00165F]/70 hover:dark:bg-white/5 hover:bg-gray-100 transition"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  );
}
