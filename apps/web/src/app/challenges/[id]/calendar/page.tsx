'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Clock, ArrowLeft, Play, Radio, Trophy, Users, AlertCircle } from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'
import StreamPlayer from '@/components/tournaments/StreamPlayer'
import { getSocket } from '@/lib/socket'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

type Match = {
  id: string
  round: number
  player1: { id: string; username: string; avatar?: string | null }
  player2: { id: string; username: string; avatar?: string | null }
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'WALKOVER'
  deadlineAt: string | null
  walkedOver: boolean
  streamUrl?: string
  streamType?: 'YOUTUBE' | 'TWITCH' | 'FACEBOOK'
  matchLink: string
  timeRemaining: number | null
}

type Round = {
  round: number
  matches: Match[]
}

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

function isParticipant(match: Match, userId?: string): boolean {
  if (!userId) return false
  return match.player1.id === userId || match.player2.id === userId
}

export default function ChallengeCalendarPage() {
  const { user } = useAuthStore()
  const params = useParams()
  const challengeId = params.id as string
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [game, setGame] = useState('')
  const [type, setType] = useState('')
  const [participantCount, setParticipantCount] = useState(0)
  const [rounds, setRounds] = useState<Round[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [now, setNow] = useState(Date.now())

  const loadCalendar = async () => {
    try {
      const res = await fetch(`${API}/challenges/${challengeId}/calendar`)
      if (!res.ok) throw new Error('Impossible de charger le calendrier')
      const data = await res.json()
      setTitle(data.title ?? '')
      setGame(data.game ?? '')
      setType(data.type ?? '')
      setParticipantCount(data.participants ?? 0)
      setRounds(data.rounds ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCalendar()
  }, [challengeId])

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
      setRounds((prev) =>
        prev.map((r) => ({
          ...r,
          matches: r.matches.map((m) =>
            m.id === data.matchId
              ? { ...m, streamUrl: data.streamUrl, streamType: data.streamType }
              : m,
          ),
        })),
      )
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
        <button
          onClick={() => router.push(`/challenges/${challengeId}`)}
          className="mb-6 inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour au défi
        </button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-2">
            <Trophy className="w-8 h-8 text-yellow-400" />
            Calendrier — {title}
          </h1>
          <p className="text-white/70">
            {game} · {type} · <Users className="w-4 h-4 inline -mt-0.5 mr-1" />
            {participantCount} participants
          </p>
        </div>

        {rounds.length === 0 ? (
          <div className="bg-white/10 backdrop-blur rounded-xl p-8 text-center text-white/70">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            Aucun match programmé. Minimum 2 participants requis.
          </div>
        ) : (
          rounds.map((round) => (
            <div key={round.round} className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Users className="w-6 h-6" />
                Journée {round.round}
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {round.matches.map((match) => (
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
          ))
        )}
      </div>
    </div>
  )
}

function getAuthToken(): string {
  try {
    const stored = localStorage.getItem('skyplay-auth')
    if (!stored) return ''
    const parsed = JSON.parse(stored)
    return parsed?.tokens?.idToken || parsed?.tokens?.accessToken || ''
  } catch {
    return ''
  }
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
  const isUrgent = timeRemaining !== null && timeRemaining < 86400
  const isActive = match.status === 'PENDING' || match.status === 'IN_PROGRESS'
  const hasStream = !!match.streamUrl
  const userIsPlayer = isParticipant(match, user?.id)

  const [streamInput, setStreamInput] = useState('')
  const [streamSubmitting, setStreamSubmitting] = useState(false)
  const [streamError, setStreamError] = useState('')
  const [editing, setEditing] = useState(false)

  const handleSubmitStream = async () => {
    const url = streamInput.trim()
    if (!url) return
    setStreamSubmitting(true)
    setStreamError('')
    try {
      const token = getAuthToken()
      const res = await fetch(`${API}/challenges/matches/${match.id}/stream`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ streamUrl: url }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Erreur')
      }
      setStreamInput('')
      setEditing(false)
      onStreamStarted()
    } catch (err) {
      setStreamError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setStreamSubmitting(false)
    }
  }

  const showStreamInput = isActive && userIsPlayer && (!hasStream || editing)

  return (
    <div className="bg-white/10 backdrop-blur rounded-xl p-5 border border-white/20 hover:border-white/40 transition-all flex flex-col gap-3">

      {/* Header row: status + LIVE badge */}
      <div className="flex items-center justify-between">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor(match.status, match.walkedOver)}`}>
          {match.walkedOver ? 'FORFAIT' : match.status}
        </span>
        <div className="flex items-center gap-2">
          {hasStream && !editing && (
            <span className="flex items-center gap-1 text-red-400 text-xs font-bold animate-pulse">
              <Radio className="w-3 h-3" /> 🔴 LIVE
            </span>
          )}
          {match.walkedOver && (
            <span className="text-yellow-400 text-xs font-bold">Victoire par forfait</span>
          )}
        </div>
      </div>

      {/* Players row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <img
            src={match.player1.avatar || '/default-avatar.png'}
            alt={match.player1.username}
            className="w-8 h-8 rounded-full shrink-0"
            onError={(e) => { (e.target as HTMLImageElement).src = '/default-avatar.png' }}
          />
          <span className="text-white font-semibold text-sm truncate">{match.player1.username}</span>
        </div>
        <span className="text-white/40 text-xs font-bold mx-2 shrink-0">VS</span>
        <div className="flex items-center gap-2 min-w-0 flex-row-reverse">
          <img
            src={match.player2.avatar || '/default-avatar.png'}
            alt={match.player2.username}
            className="w-8 h-8 rounded-full shrink-0"
            onError={(e) => { (e.target as HTMLImageElement).src = '/default-avatar.png' }}
          />
          <span className="text-white font-semibold text-sm truncate text-right">{match.player2.username}</span>
        </div>
      </div>

      {/* Countdown */}
      {match.deadlineAt && (
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-white/50 shrink-0" />
          <span
            className={`font-mono text-xs font-bold ${
              isExpired ? 'text-red-400' : isUrgent ? 'text-orange-400' : 'text-green-400'
            }`}
          >
            {formatTime(timeRemaining)}
          </span>
        </div>
      )}

      {/* Stream player (when streamUrl set and not editing) */}
      {hasStream && match.streamType && !editing && (
        <div>
          <StreamPlayer streamUrl={match.streamUrl!} streamType={match.streamType} />
        </div>
      )}

      {/* Stream input — visible to players on PENDING or IN_PROGRESS matches */}
      {showStreamInput && (
        <div className="space-y-1.5">
          <div className="flex gap-2">
            <input
              type="text"
              value={streamInput}
              onChange={(e) => { setStreamInput(e.target.value); setStreamError('') }}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmitStream()}
              placeholder="🎥 Colle ton lien YouTube Live / Twitch"
              className="flex-1 px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-xs placeholder:text-white/40 focus:outline-none focus:border-[#0097FC] min-w-0"
            />
            <button
              onClick={handleSubmitStream}
              disabled={streamSubmitting || !streamInput.trim()}
              className="px-3 py-2 bg-[#0097FC] hover:bg-[#0097FC]/80 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              {streamSubmitting ? '…' : '📡 Démarrer'}
            </button>
          </div>
          {streamError && <p className="text-xs text-red-400">{streamError}</p>}
          {editing && (
            <button onClick={() => { setEditing(false); setStreamInput('') }} className="text-xs text-white/40 hover:text-white/70 transition-colors">
              Annuler
            </button>
          )}
        </div>
      )}

      {/* Modifier button — visible to players when stream set and not editing */}
      {hasStream && userIsPlayer && isActive && !editing && (
        <button
          onClick={() => { setEditing(true); setStreamInput(match.streamUrl ?? '') }}
          className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors text-left"
        >
          ✏️ Modifier l'URL du stream
        </button>
      )}

      {/* Jouer button */}
      <div className="flex items-center justify-end pt-1">
        <a
          href={match.matchLink}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0097FC] hover:bg-[#0097FC]/80 text-white text-xs font-semibold rounded-lg transition-colors"
        >
          <Play className="w-3 h-3" />
          Jouer
        </a>
      </div>
    </div>
  )
}
