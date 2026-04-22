'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Trophy, Users, Calendar, ArrowLeft, Play, Radio } from 'lucide-react'
import { useI18n } from '@/components/i18n/I18nProvider'
import { useAuthStore } from '@/lib/auth-store'
import StreamPlayer from '@/components/tournaments/StreamPlayer'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

type Tournament = {
  id: string
  title: string
  game: string
  type: string
  format: string
  status: string
  entryFee: number
  maxPlayers: number
  potTotal: number
  commission: number
  startsAt: string | null
  createdAt: string
  creator: { id: string; username: string; avatar?: string | null }
  participants: Array<{ user: { id: string; username: string; avatar?: string | null } }>
}

export default function TournamentPage() {
  const { t } = useI18n()
  const { user } = useAuthStore()
  const params = useParams()
  const tournamentId = params.id as string
  const router = useRouter()

  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [joining, setJoining] = useState(false)
  const [liveMatches, setLiveMatches] = useState<Array<{ id: string; streamUrl: string; streamType: 'YOUTUBE' | 'TWITCH' | 'FACEBOOK'; player1: { username: string }; player2: { username: string } }>>([])

  useEffect(() => {
    const load = async () => {
      try {
        const [tRes, cRes] = await Promise.all([
          fetch(`${API}/tournaments/${tournamentId}`),
          fetch(`${API}/tournaments/${tournamentId}/calendar`),
        ])
        if (!tRes.ok) throw new Error('Tournoi introuvable')
        const data = await tRes.json()
        setTournament(data)

        if (cRes.ok) {
          const calendar = await cRes.json()
          const live: typeof liveMatches = []
          for (const matches of Object.values(calendar) as any[]) {
            for (const m of matches) {
              if (m.status === 'IN_PROGRESS' && m.streamUrl && m.streamType) {
                live.push({
                  id: m.id,
                  streamUrl: m.streamUrl,
                  streamType: m.streamType,
                  player1: m.player1,
                  player2: m.player2,
                })
              }
            }
          }
          setLiveMatches(live)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [tournamentId])

  const handleJoin = async () => {
    if (!user) {
      router.push('/login')
      return
    }
    setJoining(true)
    try {
      const token = localStorage.getItem('skyplay-auth')?.split('"')[3] ?? ''
      const res = await fetch(`${API}/tournaments/${tournamentId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Impossible de rejoindre')
      }
      window.location.reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setJoining(false)
    }
  }

  if (loading) return <div className="p-8 text-center dark:text-white">Chargement...</div>
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>
  if (!tournament) return null

  const isCreator = user?.id === tournament.creator.id
  const isParticipant = tournament.participants.some(p => p.user.id === user?.id)
  const canJoin = !isCreator && !isParticipant && tournament.status === 'OPEN' && tournament.participants.length < tournament.maxPlayers

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#00165F] to-[#000E3F] dark:from-gray-900 dark:to-black p-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.back()}
          className="mb-6 inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour
        </button>

        <div className="bg-white/10 backdrop-blur rounded-2xl p-8 border border-white/20">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <Trophy className="w-8 h-8 text-yellow-400" />
                {tournament.title}
              </h1>
              <p className="text-white/70">
                {tournament.game} · {tournament.type} · {tournament.format}
              </p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
              tournament.status === 'OPEN' ? 'bg-green-500/20 text-green-400 border border-green-400/30' :
              tournament.status === 'POOL_PHASE' ? 'bg-blue-500/20 text-blue-400 border border-blue-400/30' :
              tournament.status === 'KNOCKOUT_PHASE' ? 'bg-orange-500/20 text-orange-400 border border-orange-400/30' :
              tournament.status === 'COMPLETED' ? 'bg-gray-500/20 text-gray-400 border border-gray-400/30' :
              'bg-gray-500/20 text-gray-400 border border-gray-400/30'
            }`}>
              {tournament.status}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div>
              <p className="text-white/50 text-sm mb-1">Participants</p>
              <p className="text-white font-bold flex items-center gap-1">
                <Users className="w-4 h-4" />
                {tournament.participants.length}/{tournament.maxPlayers}
              </p>
            </div>
            <div>
              <p className="text-white/50 text-sm mb-1">Cagnotte</p>
              <p className="text-green-400 font-bold">{tournament.potTotal.toLocaleString()} SKY</p>
            </div>
            <div>
              <p className="text-white/50 text-sm mb-1">Frais d'entrée</p>
              <p className="text-white font-bold">{tournament.entryFee.toLocaleString()} SKY</p>
            </div>
            <div>
              <p className="text-white/50 text-sm mb-1">Commission</p>
              <p className="text-white font-bold">{(tournament.commission * 100).toFixed(0)}%</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mb-8">
            <Link
              href={`/tournaments/${tournamentId}/calendar`}
              className="inline-flex items-center gap-2 px-5 py-2 bg-[#0097FC] hover:bg-[#0097FC]/80 text-white font-semibold rounded-lg transition-colors"
            >
              <Calendar className="w-4 h-4" />
              Voir le calendrier
            </Link>
            {canJoin && (
              <button
                onClick={handleJoin}
                disabled={joining}
                className="inline-flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-600/80 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                {joining ? 'Inscription...' : 'Rejoindre'}
              </button>
            )}
            {isParticipant && (
              <span className="inline-flex items-center gap-2 px-5 py-2 bg-white/10 text-white font-semibold rounded-lg">
                <Users className="w-4 h-4" />
                Déjà inscrit
              </span>
            )}
          </div>

          {/* Live matches section */}
          {liveMatches.length > 0 && (
            <div className="border-t border-white/20 pt-6 mb-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Radio className="w-5 h-5 text-red-400 animate-pulse" />
                Matchs en direct
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {liveMatches.map((m) => (
                  <div key={m.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-white/70 text-sm">
                        {m.player1.username} vs {m.player2.username}
                      </span>
                      <span className="flex items-center gap-1 text-red-400 text-xs font-bold animate-pulse">
                        <Radio className="w-3 h-3" /> LIVE
                      </span>
                    </div>
                    <StreamPlayer streamUrl={m.streamUrl} streamType={m.streamType} />
                  </div>
                ))}
              </div>
            </div>
          )}
          {liveMatches.length === 0 && tournament.status !== 'OPEN' && (
            <div className="border-t border-white/20 pt-6 mb-6">
              <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <Radio className="w-5 h-5 text-white/50" />
                Matchs en direct
              </h2>
              <p className="text-white/50 text-sm">Aucun match en direct pour l'instant</p>
            </div>
          )}

          <div className="border-t border-white/20 pt-6">
            <h2 className="text-xl font-bold text-white mb-4">Participants</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {tournament.participants.map((p) => (
                <div key={p.user.id} className="flex items-center gap-2 bg-white/5 rounded-lg p-3">
                  <img
                    src={p.user.avatar || '/default-avatar.png'}
                    alt={p.user.username}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="text-white text-sm font-medium">{p.user.username}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
