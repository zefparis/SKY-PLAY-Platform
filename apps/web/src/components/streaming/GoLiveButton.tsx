'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Radio, Square, ExternalLink, Youtube } from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'
import { useScreenStream } from '@/hooks/useScreenStream'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

interface GoLiveButtonProps {
  matchId: string
  matchTitle: string
  /** Optional callback fired when streaming successfully begins. */
  onStarted?: (watchUrl: string) => void
  /** Optional callback fired when streaming stops (manually or remotely). */
  onStopped?: () => void
  /** Compact variant tightens padding/typography for in-row use. */
  compact?: boolean
}

interface StartResponse {
  broadcastId: string
  streamKey: string
  rtmpEndpoint: string
  streamUrl: string
  watchUrl: string
}

interface LinkedAccount {
  provider: string
}

/**
 * One-click "go live" control for match participants. Wires a YouTube live
 * broadcast (created server-side) to the user's screen capture via the
 * `useScreenStream` hook. The button auto-collapses to a CTA when the user
 * has not linked their YouTube account yet.
 */
export default function GoLiveButton({
  matchId,
  matchTitle,
  onStarted,
  onStopped,
  compact = false,
}: GoLiveButtonProps) {
  const token = useAuthStore((s) => s.tokens?.idToken)

  const { startStream, stopStream, isStreaming, error: streamError } = useScreenStream()

  const [hasYoutube, setHasYoutube] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [watchUrl, setWatchUrl] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)

  const startedAtRef = useRef<number | null>(null)

  /** Probe the user's linked accounts to know whether to show the CTA. */
  useEffect(() => {
    if (!token) {
      setHasYoutube(null)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`${API}/users/me/linked-accounts`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) {
          if (!cancelled) setHasYoutube(false)
          return
        }
        const accounts = (await res.json()) as LinkedAccount[]
        if (!cancelled) {
          setHasYoutube(accounts.some((a) => a.provider === 'YOUTUBE'))
        }
      } catch {
        if (!cancelled) setHasYoutube(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token])

  // Tick the on-screen elapsed counter while streaming.
  useEffect(() => {
    if (!isStreaming) {
      startedAtRef.current = null
      setElapsed(0)
      return
    }
    if (startedAtRef.current == null) {
      startedAtRef.current = Date.now()
    }
    const id = window.setInterval(() => {
      if (startedAtRef.current != null) {
        setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000))
      }
    }, 1000)
    return () => window.clearInterval(id)
  }, [isStreaming])

  // If the screen-capture pipeline dies on its own (user revoked permission,
  // tab switched), tell the backend to close the broadcast too.
  const handleAutoStop = useRef<() => void>(() => undefined)
  handleAutoStop.current = useCallback(() => {
    if (!token) return
    fetch(`${API}/streaming/stop`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ matchId }),
    }).catch(() => {
      /* server-side cleanup will reconcile via the YouTube webhook */
    })
    setWatchUrl(null)
    onStopped?.()
  }, [matchId, onStopped, token])

  // Detect transition isStreaming: true → false to fire the auto-stop.
  const wasStreamingRef = useRef(false)
  useEffect(() => {
    if (wasStreamingRef.current && !isStreaming) {
      handleAutoStop.current()
    }
    wasStreamingRef.current = isStreaming
  }, [isStreaming])

  const startBroadcast = useCallback(async () => {
    if (!token) {
      setActionError('Connecte-toi pour démarrer un live')
      return
    }
    setLoading(true)
    setActionError(null)
    try {
      const res = await fetch(`${API}/streaming/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ matchId, title: matchTitle }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(
          (body as { message?: string }).message ?? 'Impossible de démarrer le stream',
        )
      }
      const data = (await res.json()) as StartResponse
      setWatchUrl(data.watchUrl)
      onStarted?.(data.watchUrl)

      // Start screen capture only after YouTube has provisioned the broadcast.
      // The hook handles its own error reporting via `streamError`.
      // The token authenticates the WebSocket upgrade against RtmpWsGateway.
      await startStream(data.rtmpEndpoint, data.streamKey, token)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [matchId, matchTitle, onStarted, startStream, token])

  const stopBroadcast = useCallback(async () => {
    setLoading(true)
    setActionError(null)
    try {
      stopStream()
      if (token) {
        await fetch(`${API}/streaming/stop`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ matchId }),
        }).catch(() => {
          /* best-effort */
        })
      }
      setWatchUrl(null)
      onStopped?.()
    } finally {
      setLoading(false)
    }
  }, [matchId, onStopped, stopStream, token])

  const elapsedLabel = useMemo(() => {
    const h = Math.floor(elapsed / 3600)
    const m = Math.floor((elapsed % 3600) / 60)
    const s = elapsed % 60
    const pad = (n: number) => n.toString().padStart(2, '0')
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
  }, [elapsed])

  const sizing = compact
    ? 'px-2.5 py-1.5 text-xs gap-1.5'
    : 'px-3.5 py-2 text-sm gap-2'

  // ── 1. Not authenticated → render nothing ────────────────────────────────
  if (!token) return null

  // ── 2. YouTube not linked → CTA to /profile ──────────────────────────────
  if (hasYoutube === false) {
    return (
      <Link
        href="/profile?youtube=connect"
        title="Lie ton compte YouTube pour streamer"
        className={`inline-flex items-center rounded-lg bg-white/10 hover:bg-white/15 text-white/80 hover:text-white border border-white/15 transition ${sizing}`}
      >
        <Youtube className="w-4 h-4 text-red-400" />
        <span className="font-semibold">Connecter YouTube</span>
      </Link>
    )
  }

  // ── 3. Probing linked accounts ───────────────────────────────────────────
  if (hasYoutube === null) {
    return (
      <span
        className={`inline-flex items-center rounded-lg bg-white/5 text-white/40 border border-white/10 ${sizing}`}
      >
        <Radio className="w-4 h-4 animate-pulse" />
        <span>…</span>
      </span>
    )
  }

  // ── 4. Streaming → STOP button + counter ─────────────────────────────────
  if (isStreaming) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={stopBroadcast}
          disabled={loading}
          className={`inline-flex items-center rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 transition disabled:opacity-50 ${sizing}`}
        >
          <Square className="w-4 h-4" />
          <span className="font-bold">Arrêter</span>
        </button>
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-500/15 border border-red-500/40 text-red-300 text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
          EN DIRECT · <span className="font-mono">{elapsedLabel}</span>
        </span>
        {watchUrl && (
          <a
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Ouvrir sur YouTube"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/8 hover:bg-white/15 text-white/70 hover:text-white text-xs transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">YouTube</span>
          </a>
        )}
      </div>
    )
  }

  // ── 5. Idle → "Go Live" button ───────────────────────────────────────────
  return (
    <div className="flex flex-col items-stretch gap-1">
      <button
        onClick={startBroadcast}
        disabled={loading}
        className={`inline-flex items-center justify-center rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold shadow-md shadow-red-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed ${sizing}`}
      >
        <Radio className="w-4 h-4" />
        <span>{loading ? 'Démarrage…' : 'Go Live'}</span>
      </button>
      {(actionError || streamError) && (
        <span className="text-[11px] text-red-300/90 max-w-[14rem] text-center">
          {actionError ?? streamError}
        </span>
      )}
    </div>
  )
}
