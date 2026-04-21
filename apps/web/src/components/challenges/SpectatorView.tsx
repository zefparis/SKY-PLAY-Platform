'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Eye, Users } from 'lucide-react'
import { formatSKY } from '@/lib/currency'

export type SpectatorEvent = {
  id: string
  icon: string
  text: string
  at: Date
}

type Props = {
  challenge: any
  submissionStatus: { submittedCount: number; totalPlayers: number } | null
  events: SpectatorEvent[]
  prizes: { first: number; second: number; third: number }
}

export default function SpectatorView({ challenge, submissionStatus, events, prizes }: Props) {
  const submittedUserIds = new Set((challenge.results ?? []).map((r: any) => r.userId))

  return (
    <div className="rounded-2xl border border-[#2a2d3e] bg-[#0d1117] p-4 sm:p-6 mb-4">

      {/* Header badge */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FD2E5F] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FD2E5F]" />
          </span>
          <span className="font-black text-sm text-[#FD2E5F] tracking-wide">EN DIRECT</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-white/40">
          <Eye className="w-3.5 h-3.5" />
          <span>Mode spectateur</span>
        </div>
      </div>

      {/* Submission progress bar */}
      {submissionStatus && (
        <div className="mb-5">
          <div className="flex justify-between text-xs text-white/50 mb-1.5">
            <span>Résultats soumis</span>
            <span className="font-bold text-white/70">
              {submissionStatus.submittedCount} / {submissionStatus.totalPlayers}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#0097FC] to-[#FD2E5F]"
              initial={{ width: 0 }}
              animate={{
                width: `${(submissionStatus.submittedCount / submissionStatus.totalPlayers) * 100}%`,
              }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}

      {/* Scoreboard participants */}
      <div className="mb-5">
        <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Users className="w-3.5 h-3.5" /> Participants
        </h3>
        <div className="space-y-2">
          {(challenge.participants ?? []).map((p: any) => {
            const submitted = submittedUserIds.has(p.userId)
            return (
              <div
                key={p.id}
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0097FC] to-[#003399] flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {p.user?.username?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm text-white/80 font-medium">{p.user?.username}</span>
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    submitted
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-white/10 text-white/40'
                  }`}
                >
                  {submitted ? '✅ Soumis' : '⏳ En attente'}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Pot total & distribution */}
      <div className="mb-5 rounded-xl bg-white/5 p-3 text-center">
        <p className="text-xs text-white/40 mb-1">Pot total</p>
        <p className="text-2xl font-black text-[#0097FC]">🪙 {formatSKY(challenge.potTotal)}</p>
        <div className="flex justify-center gap-5 mt-2 text-xs text-white/50">
          <span>🥇 {formatSKY(prizes.first)}</span>
          <span>🥈 {formatSKY(prizes.second)}</span>
          <span>🥉 {formatSKY(prizes.third)}</span>
        </div>
      </div>

      {/* Timeline d'événements */}
      {events.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
            Événements
          </h3>
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {[...events].reverse().map((ev) => (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2.5 text-sm"
                >
                  <span className="mt-px">{ev.icon}</span>
                  <span className="text-white/70 flex-1">{ev.text}</span>
                  <span className="text-xs text-white/30 shrink-0">
                    {ev.at.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  )
}
