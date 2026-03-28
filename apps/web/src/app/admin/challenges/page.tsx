'use client'

import { useEffect, useState } from 'react'
import AdminBadge from '@/components/admin/AdminBadge'
import { useAuthStore } from '@/lib/auth-store'

export default function ChallengesPage() {
  const idToken = useAuthStore((s) => s.tokens?.idToken)
  const [challenges, setChallenges] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!idToken) return
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/challenges?limit=20`, {
      headers: { Authorization: `Bearer ${idToken}` },
    })
      .then(res => res.json())
      .then(data => setChallenges(data.challenges || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [idToken])

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-2xl sm:text-3xl font-black dark:text-white text-[#00165F]" style={{ fontFamily: 'Dena, sans-serif' }}>
        Défis
      </h1>

      <div className="bg-white dark:bg-[#00165F]/40 rounded-2xl border dark:border-white/10 border-[#00165F]/10 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#0097FC]/30 border-t-[#0097FC] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead className="bg-[#00165F]/20 dark:bg-[#00165F]/60">
                <tr>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase">Titre</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase hidden sm:table-cell">Type</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase">Statut</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase hidden md:table-cell">Joueurs</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase">Pot</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold dark:text-white/60 text-[#00165F]/60 uppercase hidden lg:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-white/10 divide-[#00165F]/10">
                {challenges.map((challenge) => (
                  <tr key={challenge.id} className="dark:hover:bg-white/5 hover:bg-[#00165F]/5 transition">
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <span className="font-semibold dark:text-white text-[#00165F] text-sm block truncate max-w-[120px] sm:max-w-xs">{challenge.title}</span>
                      <span className="text-xs dark:text-white/40 text-[#00165F]/40 sm:hidden">{challenge.type}</span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 hidden sm:table-cell"><AdminBadge status={challenge.type} variant="info" /></td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <AdminBadge 
                        status={challenge.status} 
                        variant={challenge.status === 'COMPLETED' ? 'success' : challenge.status === 'DISPUTED' ? 'danger' : 'default'} 
                      />
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm dark:text-white/60 text-[#00165F]/60 hidden md:table-cell">
                      {challenge.participants?.length || 0}/{challenge.maxPlayers}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-bold dark:text-white text-[#00165F]">{challenge.potTotal} CFA</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm dark:text-white/60 text-[#00165F]/60 hidden lg:table-cell">
                      {new Date(challenge.createdAt).toLocaleDateString('fr-FR')}
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
