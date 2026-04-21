'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Users, Trophy, Clock, Eye, ArrowRight } from 'lucide-react'
import { formatSKY } from '@/lib/currency'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

const TYPE_LABELS: Record<string, string> = {
  DUEL: 'Duel 1v1',
  SMALL_CHALLENGE: 'Petit défi',
  STANDARD: 'Standard',
  MEDIUM_TOURNAMENT: 'Tournoi moyen',
  BIG_TOURNAMENT: 'Grand tournoi',
  PREMIUM_TOURNAMENT: 'Tournoi premium',
}

function formatElapsed(startedAt: string | null | undefined): string {
  if (!startedAt) return '—'
  const diff = Date.now() - new Date(startedAt).getTime()
  const mins = Math.floor(diff / 60_000)
  const hrs = Math.floor(mins / 60)
  if (hrs > 0) return `${hrs}h ${mins % 60}min`
  return `${mins} min`
}

export default function LivePage() {
  const [challenges, setChallenges] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [, setTick] = useState(0)

  const fetchLive = async () => {
    try {
      const res = await fetch(`${API}/challenges?status=IN_PROGRESS&limit=20`)
      if (res.ok) {
        const data = await res.json()
        setChallenges(data.challenges ?? data ?? [])
      }
    } catch {}
    finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLive()
    const refresh = setInterval(fetchLive, 30_000)
    const tick = setInterval(() => setTick(n => n + 1), 60_000)
    return () => { clearInterval(refresh); clearInterval(tick) }
  }, [])

  return (
    <div className="min-h-screen dark:bg-[#00165F]/5 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FD2E5F] opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#FD2E5F]" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black dark:text-white text-[#00165F]">
              LIVE — Matchs en cours
            </h1>
          </div>
          <p className="text-sm dark:text-white/40 text-[#00165F]/40">
            Suivi en temps réel des compétitions actives · Actualisation toutes les 30 secondes
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#0097FC]/30 border-t-[#0097FC] rounded-full animate-spin" />
          </div>
        ) : challenges.length === 0 ? (
          <div className="rounded-2xl border border-dashed dark:border-white/10 border-[#00165F]/15 p-16 text-center">
            <p className="text-4xl mb-4">🎮</p>
            <p className="font-bold dark:text-white/60 text-[#00165F]/60 text-lg">
              Aucun match en cours
            </p>
            <p className="text-sm dark:text-white/30 text-[#00165F]/30 mt-1">Revenez bientôt !</p>
            <Link
              href="/challenges"
              className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl bg-[#0097FC]/10 text-[#0097FC] text-sm font-semibold hover:bg-[#0097FC]/20 transition"
            >
              Voir les défis ouverts <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {challenges.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="rounded-2xl border border-[#2a2d3e] bg-[#0d1117] p-4 sm:p-5 flex items-center gap-4"
              >
                {/* Live dot */}
                <div className="shrink-0">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FD2E5F] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FD2E5F]" />
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-black text-white truncate">{c.title}</p>
                  <p className="text-xs text-white/40 mt-0.5">
                    {c.game} · {TYPE_LABELS[c.type] ?? c.type}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-white/50">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {c._count?.participants ?? c.participants?.length ?? '?'} / {c.maxPlayers}
                    </span>
                    <span className="flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5 text-[#0097FC]" />
                      <span className="text-[#0097FC] font-semibold">🪙 {formatSKY(c.potTotal)}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatElapsed(c.startedAt)}
                    </span>
                  </div>
                </div>

                {/* CTA */}
                <Link
                  href={`/challenges/${c.id}`}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FD2E5F]/10 text-[#FD2E5F] text-xs font-bold hover:bg-[#FD2E5F]/20 transition whitespace-nowrap"
                >
                  <Eye className="w-3.5 h-3.5" /> Regarder
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
