'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Clock, Users, Trophy, AlertCircle, Play, Radio } from 'lucide-react'
import { useI18n } from '@/components/i18n/I18nProvider'
import { useAuthStore } from '@/lib/auth-store'
import Link from 'next/link'
import StreamPlayer from '@/components/tournaments/StreamPlayer'
import StreamSetupCard from '@/components/streaming/StreamSetupCard'
import Avatar from '@/components/ui/Avatar'
import { getSocket } from '@/lib/socket'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

type Match = {
  id: string
  phase: string
  round: number
  player1: { id: string; username: string; avatar?: string | null }
  player2: { id: string; username: string; avatar?: string | null }
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'WALKOVER'
  scheduledAt: string | null
  deadlineAt: string
  walkedOver: boolean
  matchLink: string
  timeRemaining: number | null
  streamUrl?: string
  streamType?: 'YOUTUBE' | 'TWITCH' | 'FACEBOOK'
}

type CalendarData = Record<string, Match[]>

function formatTime(seconds: number | null): string {
  if (!seconds || seconds <= 0) return 'EXPIRÉ'
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${days}j ${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

function statusColor(status: Match['status'], walkedOver: boolean) {
  if (walkedOver) return 'bg-orange-500 text-white'
  switch (status) {
    case 'PENDING': return 'bg-gray-500 text-white'
    case 'IN_PROGRESS': return 'bg-cyan-500 text-white animate-pulse'
    case 'COMPLETED': return 'bg-green-500 text-white'
    default: return 'bg-gray-500 text-white'
  }
}

function phaseLabel(phase: string) {
  const map: Record<string, string> = {
    POOL: 'Phase de groupe',
    ROUND_OF_16: '1/8 de finale',
    QUARTER_FINAL: '1/4 de finale',
    SEMI_FINAL: '1/2 finale',
    THIRD_PLACE: 'Petite finale',
    FINAL: 'Finale',
    CHAMPIONSHIP_ROUND: 'Championnat',
  }
  return map[phase] ?? phase
}

function isParticipant(match: Match, userId?: string): boolean {
  if (!userId) return false
  return match.player1.id === userId || match.player2.id === userId
}

export default function TournamentCalendarPage() {
  const { t } = useI18n()
  const { user } = useAuthStore()
  const params = useParams()
  const tournamentId = params.id as string
  const router = useRouter()

  const [calendar, setCalendar] = useState<CalendarData>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [now, setNow] = useState(Date.now())

  const loadCalendar = async () => {
    try {
      const res = await fetch(`${API}/tournaments/${tournamentId}/calendar`)
      if (!res.ok) throw new Error('Impossible de charger le calendrier')
      const data = await res.json()
      setCalendar(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCalendar()
  }, [tournamentId])

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Socket listener for stream_started
  useEffect(() => {
    const tokens = localStorage.getItem('skyplay-auth')
    const parsed = tokens ? JSON.parse(tokens) : null
    const idToken = parsed?.tokens?.idToken || parsed?.tokens?.accessToken || ''
    const socket = getSocket(idToken)
    if (!socket) return

    const handleStreamStarted = (data: { matchId: string; streamUrl: string; streamType: Match['streamType']; playerName: string }) => {
      setCalendar((prev) => {
        const next: CalendarData = {}
        for (const [key, matches] of Object.entries(prev)) {
          next[key] = matches.map((m) =>
            m.id === data.matchId
              ? { ...m, streamUrl: data.streamUrl, streamType: data.streamType }
              : m,
          )
        }
        return next
      })
    }

    socket.on('stream_started', handleStreamStarted)
    return () => {
      socket.off('stream_started', handleStreamStarted)
    }
  }, [])

  if (loading) return <div className="p-8 text-center dark:text-white">Chargement...</div>
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#00165F] to-[#000E3F] dark:from-gray-900 dark:to-black p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-2">
            <Trophy className="w-8 h-8 text-yellow-400" />
            Calendrier du tournoi
          </h1>
          <p className="text-white/70">Tous les matchs avec compte à rebours en direct</p>
        </div>

        {Object.entries(calendar).length === 0 ? (
          <div className="bg-white/10 backdrop-blur rounded-xl p-8 text-center text-white/70">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            Aucun match programmé pour ce tournoi.
          </div>
        ) : (
          Object.entries(calendar).map(([key, matches]) => {
            const [phase, roundStr] = key.split('_R')
            const round = parseInt(roundStr, 10)
            return (
              <div key={key} className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <Users className="w-6 h-6" />
                  {phaseLabel(phase)} {round ? `Journée ${round}` : ''}
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {matches.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      user={user}
                      now={now}
                      onStreamStarted={loadCalendar}
                    />
                  ))}
                </div>
              </div>
            )
          })
        )}

        <div className="mt-12 text-center">
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    </div>
  )
}

function MatchCard({
  match,
  user,
  now,
  onStreamStarted,
}: {
  match: Match
  user: any
  now: number
  onStreamStarted: () => void
}) {
  const timeRemaining = match.deadlineAt
    ? Math.max(0, Math.floor((new Date(match.deadlineAt).getTime() - now) / 1000))
    : null
  const isExpired = timeRemaining === 0
  const isUrgent = timeRemaining && timeRemaining < 86400
  const isInProgress = match.status === 'IN_PROGRESS'
  const hasStream = !!match.streamUrl
  const userIsPlayer = isParticipant(match, user?.id)

  const { t } = useI18n()

  const handleStartStream = useCallback(async (streamUrl: string) => {
    const tokens = localStorage.getItem('skyplay-auth')
    const parsed = tokens ? JSON.parse(tokens) : null
    const token = (parsed as { tokens?: { idToken?: string; accessToken?: string } })?.tokens?.idToken
      || (parsed as { tokens?: { idToken?: string; accessToken?: string } })?.tokens?.accessToken
      || ''
    const res = await fetch(`${API}/tournaments/matches/${match.id}/stream`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ streamUrl }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error((err as { message?: string }).message || 'Erreur')
    }
    onStreamStarted()
  }, [match.id, onStreamStarted])

  return (
    <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/20 hover:border-white/40 transition-all">
      <div className="flex items-center justify-between mb-4">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor(match.status, match.walkedOver)}`}>
          {match.walkedOver ? 'FORFAIT' : match.status}
        </span>
        {hasStream && (
          <span className="flex items-center gap-1 text-red-400 text-xs font-bold animate-pulse">
            <Radio className="w-3 h-3" /> LIVE
          </span>
        )}
        {match.walkedOver && (
          <span className="text-yellow-400 text-xs font-bold">Victoire par forfait</span>
        )}
      </div>

      {/* Stream player */}
      {hasStream && match.streamType && (
        <div className="mb-4">
          <StreamPlayer streamUrl={match.streamUrl!} streamType={match.streamType} />
        </div>
      )}

      {/* Start stream input (player only, no stream yet, IN_PROGRESS) */}
      {isInProgress && !hasStream && userIsPlayer && (
        <div className="mb-4">
          <StreamSetupCard
            matchId={match.id}
            initialUrl={match.streamUrl}
            initialType={match.streamType as 'YOUTUBE' | 'TWITCH' | undefined}
            onSubmit={handleStartStream}
          />
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Avatar src={match.player1.avatar} username={match.player1.username} size={32} />
          <span className="text-white font-medium">{match.player1.username}</span>
        </div>
        <span className="text-white/50 text-sm">vs</span>
        <div className="flex items-center gap-2">
          <span className="text-white font-medium">{match.player2.username}</span>
          <Avatar src={match.player2.avatar} username={match.player2.username} size={32} />
        </div>
      </div>

      {match.deadlineAt && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-white/70" />
            <span className="text-xs text-white/70">Temps restant</span>
          </div>
          <div
            className={`font-mono text-sm font-bold ${
              isExpired ? 'text-red-400' : isUrgent ? 'text-orange-400' : 'text-green-400'
            }`}
          >
            {formatTime(timeRemaining)}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-white/50">
          {match.scheduledAt ? new Date(match.scheduledAt).toLocaleString('fr-FR') : 'Non planifié'}
        </span>
        <Link
          href={`/challenges/${match.id}`}
          className="inline-flex items-center gap-1 px-3 py-1 bg-[#0097FC] hover:bg-[#0097FC]/80 text-white text-xs font-semibold rounded-lg transition-colors"
        >
          <Play className="w-3 h-3" />
          Jouer
        </Link>
      </div>
    </div>
  )
}
