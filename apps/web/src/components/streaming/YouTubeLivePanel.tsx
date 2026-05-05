'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useAuthStore } from '@/lib/auth-store'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface LiveState {
  broadcastId: string
  rtmpUrl: string
  streamKey: string
  watchUrl: string
  lifeCycleStatus: string
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 min-w-0">
        <p className="text-white/40 text-xs mb-1">{label}</p>
        <p className="text-white/80 text-xs font-mono bg-black/30 rounded-lg px-3 py-2 truncate select-all">
          {value}
        </p>
      </div>
      <button
        onClick={copy}
        className="shrink-0 px-3 py-2 rounded-lg bg-white/10 text-white/70 text-xs font-semibold hover:bg-white/15 transition"
      >
        {copied ? '✓' : 'Copier'}
      </button>
    </div>
  )
}

export default function YouTubeLivePanel() {
  const token = useAuthStore((s) => s.tokens?.idToken)
  const [live, setLive] = useState<LiveState | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const headers = useCallback(
    () => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }),
    [token],
  )

  // ── Poll status while a live exists ──────────────────────────────────
  useEffect(() => {
    if (!live?.broadcastId || !token) return

    const poll = async () => {
      try {
        const res = await fetch(
          `${API}/streaming/youtube/live/status?broadcastId=${live.broadcastId}`,
          { headers: headers() },
        )
        if (res.ok) {
          const data = await res.json()
          setLive((prev) =>
            prev ? { ...prev, lifeCycleStatus: data.lifeCycleStatus } : prev,
          )
          if (data.lifeCycleStatus === 'complete' || data.lifeCycleStatus === 'revoked') {
            setLive(null)
          }
        }
      } catch { /* ignore poll errors */ }
    }

    pollRef.current = setInterval(poll, 10_000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [live?.broadcastId, token, headers])

  // ── Create live ──────────────────────────────────────────────────────
  const createLive = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API}/streaming/youtube/live/create`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({}),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as any).message ?? `Erreur ${res.status}`)
      }
      const data = await res.json()
      setLive({
        broadcastId: data.broadcastId,
        rtmpUrl: data.rtmpUrl,
        streamKey: data.streamKey,
        watchUrl: data.watchUrl,
        lifeCycleStatus: 'ready',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [token, headers])

  // ── Transition to live ───────────────────────────────────────────────
  const startLive = useCallback(async () => {
    if (!token || !live) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `${API}/streaming/youtube/live/${live.broadcastId}/start`,
        { method: 'POST', headers: headers() },
      )
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as any).message ?? `Erreur ${res.status}`)
      }
      setLive((prev) => (prev ? { ...prev, lifeCycleStatus: 'live' } : prev))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [token, live, headers])

  // ── Stop live ────────────────────────────────────────────────────────
  const stopLive = useCallback(async () => {
    if (!token || !live) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `${API}/streaming/youtube/live/${live.broadcastId}/stop`,
        { method: 'POST', headers: headers() },
      )
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as any).message ?? `Erreur ${res.status}`)
      }
      setLive(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [token, live, headers])

  // ── Elapsed timer ────────────────────────────────────────────────────
  const [elapsed, setElapsed] = useState(0)
  const startedAtRef = useRef<number | null>(null)

  useEffect(() => {
    if (live?.lifeCycleStatus !== 'live') {
      startedAtRef.current = null
      setElapsed(0)
      return
    }
    if (!startedAtRef.current) startedAtRef.current = Date.now()
    const id = setInterval(() => {
      if (startedAtRef.current) {
        setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000))
      }
    }, 1000)
    return () => clearInterval(id)
  }, [live?.lifeCycleStatus])

  const fmtTime = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${h > 0 ? `${h}:` : ''}${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  // ── UI ───────────────────────────────────────────────────────────────

  if (!live) {
    return (
      <div className="mt-4 p-4 rounded-xl bg-[#0d1020] border border-[#2a2d3e] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-semibold text-sm">YouTube Live</p>
            <p className="text-white/40 text-xs mt-0.5">Streame en direct via OBS</p>
          </div>
          <button
            onClick={createLive}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              '🔴'
            )}
            Démarrer un live
          </button>
        </div>

        {/* OBS 3-step guide */}
        <div className="rounded-lg bg-white/5 border border-white/10 p-3 space-y-2">
          <p className="text-white/70 text-xs font-semibold mb-2">Comment streamer avec OBS :</p>
          <div className="flex items-start gap-2">
            <span className="shrink-0 w-5 h-5 rounded-full bg-[#0097FC]/20 text-[#0097FC] text-xs font-bold flex items-center justify-center">1</span>
            <p className="text-white/60 text-xs">
              Télécharge{' '}
              <a href="https://obsproject.com/download" target="_blank" rel="noopener noreferrer" className="text-[#0097FC] underline hover:text-[#0097FC]/80">
                OBS Studio
              </a>{' '}
              (gratuit, Windows/Mac/Linux)
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="shrink-0 w-5 h-5 rounded-full bg-[#0097FC]/20 text-[#0097FC] text-xs font-bold flex items-center justify-center">2</span>
            <p className="text-white/60 text-xs">Clique &quot;Démarrer un live&quot; ci-dessus, puis copie l&apos;URL RTMP + la clé de stream</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="shrink-0 w-5 h-5 rounded-full bg-[#0097FC]/20 text-[#0097FC] text-xs font-bold flex items-center justify-center">3</span>
            <p className="text-white/60 text-xs">Dans OBS : Paramètres → Stream → Colle l&apos;URL et la clé → Démarrer le streaming</p>
          </div>
        </div>

        {/* Disabled screen-share button */}
        <div className="relative group">
          <button
            disabled
            className="w-full px-4 py-2 rounded-lg bg-white/5 text-white/30 text-xs font-semibold border border-white/10 cursor-not-allowed flex items-center justify-center gap-2"
          >
            🖥️ Screen Share (navigateur)
          </button>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg bg-[#1a1d2e] border border-[#2a2d3e] text-white/70 text-[11px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none shadow-lg">
            Streaming navigateur temporairement indisponible — Utilisez OBS
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-xs bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
        )}
      </div>
    )
  }

  const isLive = live.lifeCycleStatus === 'live'

  return (
    <div className="mt-4 p-4 rounded-xl bg-[#0d1020] border border-[#2a2d3e] space-y-4">
      {/* Status bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isLive ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              EN DIRECT — {fmtTime(elapsed)}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              {live.lifeCycleStatus === 'ready' ? 'Prêt — En attente du flux RTMP' : live.lifeCycleStatus}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isLive && live.lifeCycleStatus === 'ready' && (
            <button
              onClick={startLive}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg bg-green-500 text-white text-xs font-bold hover:bg-green-600 transition disabled:opacity-50"
            >
              ▶ Go Live
            </button>
          )}
          <button
            onClick={stopLive}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold hover:bg-red-500/30 transition disabled:opacity-50"
          >
            ⏹ Terminer
          </button>
        </div>
      </div>

      {/* RTMP credentials */}
      <div className="space-y-2">
        <CopyButton label="URL du serveur RTMP" value={live.rtmpUrl} />
        <CopyButton label="Clé de stream" value={live.streamKey} />
      </div>

      {/* Watch link */}
      <a
        href={live.watchUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-sm font-semibold hover:bg-red-500/20 transition"
      >
        ▶ Regarder sur YouTube
      </a>

      {error && (
        <p className="text-red-400 text-xs bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
      )}
    </div>
  )
}
