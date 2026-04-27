'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/auth-store'
import GoLiveButton from './GoLiveButton'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

interface Props {
  challengeId: string
  challengeTitle?: string
}

interface CalendarMatch {
  id: string
  player1: { id: string }
  player2: { id: string }
  status: string
}

interface CalendarRound {
  matches: CalendarMatch[]
}

interface CalendarResponse {
  rounds?: CalendarRound[]
}

/**
 * Chat-header wrapper that resolves the current user's IN_PROGRESS match for
 * a given challenge so we can hand a concrete `matchId` to {@link GoLiveButton}.
 *
 * Renders nothing while resolving or when the user has no active match — the
 * Go Live capability is intentionally invisible to spectators.
 */
export default function ChatGoLive({ challengeId, challengeTitle }: Props) {
  const token = useAuthStore((s) => s.tokens?.idToken)
  const userId = useAuthStore((s) => s.user?.id)

  const [matchId, setMatchId] = useState<string | null>(null)
  const [opponent, setOpponent] = useState<string | null>(null)

  useEffect(() => {
    if (!token || !userId || !challengeId) {
      setMatchId(null)
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`${API}/challenges/${challengeId}/calendar`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return
        const data = (await res.json()) as CalendarResponse
        const all = (data.rounds ?? []).flatMap((r) => r.matches ?? [])
        // Pick the user's first IN_PROGRESS match — there shouldn't be more
        // than one in flight per challenge for a given player.
        const match = all.find(
          (m) =>
            m.status === 'IN_PROGRESS' &&
            (m.player1.id === userId || m.player2.id === userId),
        )
        if (cancelled) return
        if (match) {
          setMatchId(match.id)
          // We don't have usernames in this minimal type; the parent supplies
          // the challenge title which is good enough for the broadcast name.
          setOpponent(null)
        } else {
          setMatchId(null)
        }
      } catch {
        if (!cancelled) setMatchId(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [challengeId, token, userId])

  if (!matchId) return null

  return (
    <GoLiveButton
      matchId={matchId}
      matchTitle={challengeTitle ?? opponent ?? 'SkyPlay match'}
      compact
    />
  )
}
