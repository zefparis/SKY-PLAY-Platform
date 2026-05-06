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

// ── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="fixed top-5 right-5 z-[100] flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/90 text-white text-sm font-semibold shadow-2xl animate-[fadeInDown_0.2s_ease-out]">
      ✓ {message}
    </div>
  )
}

// ── Copy field ───────────────────────────────────────────────────────────────
function CopyField({ label, value, onCopy }: { label: string; value: string; onCopy: () => void }) {
  const copy = () => {
    navigator.clipboard.writeText(value).then(onCopy)
  }

  return (
    <div className="space-y-1">
      <p className="text-white/50 text-xs font-medium">{label}</p>
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0 px-3 py-2.5 rounded-lg bg-black/40 border border-white/10 font-mono text-xs text-white/90 truncate select-all">
          {value}
        </div>
        <button
          onClick={copy}
          className="shrink-0 w-9 h-9 rounded-lg bg-[#0097FC]/15 border border-[#0097FC]/30 text-[#0097FC] hover:bg-[#0097FC]/25 transition flex items-center justify-center"
          title="Copier"
        >
          📋
        </button>
      </div>
    </div>
  )
}

// ── Spinner ──────────────────────────────────────────────────────────────────
function Spinner({ className = '' }: { className?: string }) {
  return <span className={`inline-block w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin ${className}`} />
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function YouTubeLivePanel() {
  const token = useAuthStore((s) => s.tokens?.idToken)
  const [live, setLive] = useState<LiveState | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [waitingObs, setWaitingObs] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const readyPollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const headers = useCallback(
    () => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }),
    [token],
  )

  const showToast = useCallback((msg: string) => setToast(msg), [])

  // ── Poll status while live exists ──────────────────────────────────────────
  useEffect(() => {
    if (!live?.broadcastId || !token) return

    const poll = async () => {
      try {
        const res = await fetch(
          `${API}/streaming/youtube/live/status?broadcastId=${live.broadcastId}`,
          { headers: headers() },
        )
        if (res.status === 401) {
          setError('Session YouTube expirée — reconnecte ton compte YouTube depuis le profil.')
          setLive(null)
          return
        }
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

    pollRef.current = setInterval(poll, 5_000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [live?.broadcastId, token, headers])

  // ── Poll ready status when waiting for OBS connection ──────────────────────
  useEffect(() => {
    if (!waitingObs || !live?.broadcastId || !token) return

    const poll = async () => {
      try {
        const res = await fetch(
          `${API}/streaming/youtube/live/status?broadcastId=${live.broadcastId}`,
          { headers: headers() },
        )
        if (res.ok) {
          const data = await res.json()
          if (data.lifeCycleStatus === 'ready' || data.lifeCycleStatus === 'live' || data.lifeCycleStatus === 'testing') {
            setWaitingObs(false)
            if (data.lifeCycleStatus !== 'live') {
              // Auto-transition to live
              startLiveRequest()
            } else {
              setLive((prev) => prev ? { ...prev, lifeCycleStatus: 'live' } : prev)
            }
          }
        }
      } catch { /* ignore */ }
    }

    readyPollRef.current = setInterval(poll, 5_000)
    return () => { if (readyPollRef.current) clearInterval(readyPollRef.current) }
  }, [waitingObs, live?.broadcastId, token, headers])

  // ── Create live ────────────────────────────────────────────────────────────
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
      if (res.status === 401) {
        setError('Session YouTube expirée — reconnecte ton compte YouTube depuis le profil.')
        return
      }
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
        lifeCycleStatus: data.lifeCycleStatus ?? 'created',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [token, headers])

  // ── Start live request ─────────────────────────────────────────────────────
  const startLiveRequest = useCallback(async () => {
    if (!token || !live) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `${API}/streaming/youtube/live/${live.broadcastId}/start`,
        { method: 'POST', headers: headers() },
      )
      if (res.status === 401) {
        setError('Session YouTube expirée — reconnecte ton compte YouTube depuis le profil.')
        return
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        const msg = (body as any).message ?? ''
        if (msg.toLowerCase().includes('not ready') || msg.toLowerCase().includes('redundant')) {
          setWaitingObs(true)
          setError(null)
        } else {
          throw new Error(msg || `Erreur ${res.status}`)
        }
        return
      }
      setLive((prev) => (prev ? { ...prev, lifeCycleStatus: 'live' } : prev))
      setWaitingObs(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [token, live, headers])

  // ── Go live (user clicks) ──────────────────────────────────────────────────
  const goLive = useCallback(async () => {
    if (!live) return
    setWaitingObs(true)
    await startLiveRequest()
  }, [live, startLiveRequest])

  // ── Stop live ──────────────────────────────────────────────────────────────
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
      setWaitingObs(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [token, live, headers])

  // ── Elapsed timer ──────────────────────────────────────────────────────────
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

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 3 — LIVE ACTIVE
  // ═══════════════════════════════════════════════════════════════════════════
  if (live?.lifeCycleStatus === 'live') {
    return (
      <div className="mt-4 p-5 rounded-xl bg-[#0d1020] border border-[#FF3B3B]/30 space-y-4">
        {toast && <Toast message={toast} onDone={() => setToast(null)} />}

        {/* Live badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold" style={{ background: 'rgba(255,59,59,0.15)', color: '#FF3B3B' }}>
              <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: '#FF3B3B' }} />
              LIVE
            </span>
            <span className="text-white/70 text-sm font-mono">{fmtTime(elapsed)}</span>
          </div>
          <button
            onClick={stopLive}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 text-sm font-bold hover:bg-red-500/30 transition disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Spinner />}
            ⏹ Arrêter le live
          </button>
        </div>

        {/* Watch link */}
        <a
          href={live.watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-red-500/10 text-red-300 border border-red-500/20 text-sm font-semibold hover:bg-red-500/20 transition"
        >
          ▶ Regarder sur YouTube
        </a>

        {error && <p className="text-red-400 text-xs bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 2 — BROADCAST CREATED, CONFIGURE OBS
  // ═══════════════════════════════════════════════════════════════════════════
  if (live) {
    return (
      <div className="mt-4 p-5 rounded-xl bg-[#0d1020] border border-[#2a2d3e] space-y-5">
        {toast && <Toast message={toast} onDone={() => setToast(null)} />}

        {/* Header */}
        <div className="flex items-center gap-2">
          <span className="text-lg">🔴</span>
          <div>
            <p className="text-white font-bold text-sm">Live créé — Configure OBS</p>
            <p className="text-white/40 text-xs">Copie les infos ci-dessous dans OBS Studio</p>
          </div>
        </div>

        {/* RTMP credentials */}
        <div className="space-y-3 p-4 rounded-xl bg-white/[0.03] border border-white/10">
          <CopyField
            label="URL du serveur"
            value={live.rtmpUrl}
            onCopy={() => showToast('URL copiée !')}
          />
          <CopyField
            label="Clé de stream"
            value={live.streamKey}
            onCopy={() => showToast('Clé copiée !')}
          />
        </div>

        {/* OBS instructions */}
        <div className="rounded-xl bg-[#0097FC]/5 border border-[#0097FC]/20 p-4 space-y-2">
          <p className="text-[#0097FC] text-xs font-bold uppercase tracking-wide">Dans OBS :</p>
          <ol className="text-white/60 text-xs space-y-1.5 list-decimal list-inside">
            <li>Ouvre <span className="text-white/80 font-semibold">Paramètres → Stream</span></li>
            <li>Service : <span className="text-white/80 font-semibold">YouTube - RTMP</span></li>
            <li>Colle l&apos;URL du serveur + la clé de stream</li>
            <li>Clique <span className="text-white/80 font-semibold">OK</span> puis <span className="text-white/80 font-semibold">&quot;Démarrer le streaming&quot;</span></li>
          </ol>
        </div>

        {/* Go Live button */}
        {waitingObs ? (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
            <Spinner className="border-yellow-400/30 border-t-yellow-400" />
            <p className="text-yellow-300 text-xs font-medium">
              En attente de connexion OBS... (démarre le stream dans OBS d&apos;abord)
            </p>
          </div>
        ) : (
          <button
            onClick={goLive}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-bold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Spinner /> : '✓'}
            J&apos;ai configuré OBS — Aller en live
          </button>
        )}

        {/* Cancel */}
        <button
          onClick={stopLive}
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-white/5 text-white/40 border border-white/10 text-xs font-semibold hover:bg-white/10 hover:text-white/60 transition disabled:opacity-50"
        >
          Annuler le live
        </button>

        {error && <p className="text-red-400 text-xs bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 1 — NO LIVE, SHOW GUIDE + CREATE BUTTON
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="mt-4 p-5 rounded-xl bg-[#0d1020] border border-[#2a2d3e] space-y-4">
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white font-bold text-sm">YouTube Live</p>
          <p className="text-white/40 text-xs mt-0.5">Streame tes matchs en direct via OBS</p>
        </div>
      </div>

      {/* OBS guide */}
      <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4 space-y-3">
        <p className="text-white/80 text-xs font-bold flex items-center gap-2">
          🎬 Comment streamer avec OBS
        </p>

        <div className="space-y-2.5">
          <div className="flex items-start gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-[#0097FC]/20 text-[#0097FC] text-xs font-bold flex items-center justify-center">1</span>
            <p className="text-white/60 text-sm pt-0.5">
              Télécharge{' '}
              <a href="https://obsproject.com" target="_blank" rel="noopener noreferrer" className="text-[#0097FC] underline font-semibold hover:text-[#0097FC]/80">
                OBS Studio
              </a>{' '}
              <span className="text-white/30">(gratuit)</span>
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-[#0097FC]/20 text-[#0097FC] text-xs font-bold flex items-center justify-center">2</span>
            <p className="text-white/60 text-sm pt-0.5">
              Clique <span className="text-white/80 font-semibold">&quot;Démarrer un live&quot;</span> ci-dessous
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-[#0097FC]/20 text-[#0097FC] text-xs font-bold flex items-center justify-center">3</span>
            <p className="text-white/60 text-sm pt-0.5">
              Copie l&apos;URL RTMP + la clé de stream dans OBS
            </p>
          </div>
        </div>
      </div>

      {/* Create button */}
      <button
        onClick={createLive}
        disabled={loading}
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-bold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
      >
        {loading ? <Spinner /> : <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />}
        Démarrer un live
      </button>

      {error && <p className="text-red-400 text-xs bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}
    </div>
  )
}
