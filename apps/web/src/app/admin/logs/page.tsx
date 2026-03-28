'use client'

import { useEffect, useState } from 'react'
import AdminBadge from '@/components/admin/AdminBadge'
import { useAuthStore } from '@/lib/auth-store'

export default function LogsPage() {
  const idToken = useAuthStore((s) => s.tokens?.idToken)
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!idToken) return
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/logs?limit=50`, {
      headers: { Authorization: `Bearer ${idToken}` },
    })
      .then(res => res.json())
      .then(data => setLogs(data.logs || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [idToken])

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-2xl sm:text-3xl font-black dark:text-white text-[#00165F]" style={{ fontFamily: 'Dena, sans-serif' }}>
        Logs Admin
      </h1>

      <div className="bg-white dark:bg-[#00165F]/40 rounded-2xl border dark:border-white/10 border-[#00165F]/10 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#0097FC]/30 border-t-[#0097FC] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px]">
              <thead className="bg-[#00165F]/20 dark:bg-[#00165F]/60">
                <tr>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase">Admin</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase">Action</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase hidden sm:table-cell">Cible</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase hidden lg:table-cell">Détails</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-white/10 divide-[#00165F]/10">
                {logs.map((log) => (
                  <tr key={log.id} className="dark:hover:bg-white/5 hover:bg-[#00165F]/5 transition">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 font-semibold dark:text-white text-[#00165F] text-sm">
                      {log.admin?.username || 'N/A'}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <AdminBadge 
                        status={log.action} 
                        variant={log.action.includes('BAN') ? 'danger' : log.action.includes('VERIFY') ? 'success' : 'info'} 
                      />
                      <span className="text-xs dark:text-white/40 text-[#00165F]/40 sm:hidden block mt-0.5">{log.targetType || ''}</span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm dark:text-white/60 text-[#00165F]/60 hidden sm:table-cell">
                      {log.targetType || 'N/A'} {log.targetId ? `(${log.targetId.substring(0, 6)}...)` : ''}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs dark:text-white/60 text-[#00165F]/60 max-w-xs truncate hidden lg:table-cell">
                      {log.details ? JSON.stringify(log.details).substring(0, 40) : 'N/A'}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm dark:text-white/60 text-[#00165F]/60 hidden md:table-cell">
                      {new Date(log.createdAt).toLocaleString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
