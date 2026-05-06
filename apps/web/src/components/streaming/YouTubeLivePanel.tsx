'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useAuthStore } from '@/lib/auth-store'
import OBSWebSocket from 'obs-websocket-js'
import OBSTutorial from './OBSTutorial'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface LiveState {
  broadcastId: string
  rtmpUrl: string
  streamKey: string
  watchUrl: string
  lifeCycleStatus: string
}

interface ObsStreamStats {
  active: boolean
  timecode: string
  bytes: number
  skippedFrames: number
  kbps: number
}

// ── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500)
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

  // OBS WebSocket state
  const obsRef = useRef<OBSWebSocket | null>(null)
  const [obsConnected, setObsConnected] = useState(false)
  const [obsConnecting, setObsConnecting] = useState(false)
  const [obsPassword, setObsPassword] = useState('')
  const [obsError, setObsError] = useState<string | null>(null)
  const [obsStats, setObsStats] = useState<ObsStreamStats | null>(null)
  const [manualMode, setManualMode] = useState(false)
  const [tutorialOpen, setTutorialOpen] = useState(() => {
    if (typeof window === 'undefined') return true
    return localStorage.getItem('obs-tutorial-collapsed') !== 'true'
  })

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const obsStatsPollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const headers = useCallback(
    () => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }),
    [token],
  )

  const showToast = useCallback((msg: string) => setToast(msg), [])

  // ── Restore OBS password from sessionStorage ───────────────────────────────
  useEffect(() => {
    const saved = sessionStorage.getItem('obs_ws_password')
    if (saved) setObsPassword(saved)
  }, [])

  // ── OBS WebSocket connection ───────────────────────────────────────────────
  const connectObs = useCallback(async () => {
    setObsConnecting(true)
    setObsError(null)

    const obs = new OBSWebSocket()
    try {
      await obs.connect(
        'ws://localhost:4455',
        obsPassword || undefined,
      )
      obsRef.current = obs
      setObsConnected(true)
      if (obsPassword) sessionStorage.setItem('obs_ws_password', obsPassword)
      showToast('OBS connecté !')

      obs.on('ConnectionClosed', () => {
        setObsConnected(false)
        obsRef.current = null
        setObsStats(null)
      })
    } catch (err: any) {
      const msg = err?.message || String(err)
      if (msg.includes('Authentication')) {
        setObsError('Mot de passe WebSocket incorrect.')
      } else if (msg.includes('ECONNREFUSED') || msg.includes('WebSocket') || msg.includes('connect')) {
        setObsError("OBS Studio n'est pas détecté. Ouvre OBS puis réessaie.")
      } else {
        setObsError(msg)
      }
      // Fallback to manual after 3s timeout
      setTimeout(() => {
        if (!obsRef.current) setManualMode(true)
      }, 3000)
    } finally {
      setObsConnecting(false)
    }
  }, [obsPassword, showToast])

  // ── Disconnect OBS ─────────────────────────────────────────────────────────
  const disconnectObs = useCallback(() => {
    if (obsRef.current) {
      obsRef.current.disconnect()
      obsRef.current = null
    }
    setObsConnected(false)
    setObsStats(null)
  }, [])

  // ── Poll OBS stream stats ──────────────────────────────────────────────────
  useEffect(() => {
    if (!obsConnected || !obsRef.current || !live || live.lifeCycleStatus !== 'live') {
      if (obsStatsPollRef.current) clearInterval(obsStatsPollRef.current)
      return
    }

    const poll = async () => {
      try {
        const res = await obsRef.current!.call('GetStreamStatus')
        setObsStats({
          active: res.outputActive,
          timecode: res.outputTimecode || '00:00:00',
          bytes: res.outputBytes ?? 0,
          skippedFrames: res.outputSkippedFrames ?? 0,
          kbps: Math.round(((res.outputBytes ?? 0) * 8) / 1000 / Math.max(1, (res.outputDuration ?? 1000) / 1000)),
        })
      } catch { /* ignore */ }
    }

    poll()
    obsStatsPollRef.current = setInterval(poll, 5_000)
    return () => { if (obsStatsPollRef.current) clearInterval(obsStatsPollRef.current) }
  }, [obsConnected, live?.lifeCycleStatus])

  // ── Poll YouTube status ────────────────────────────────────────────────────
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
      } catch { /* ignore */ }
    }

    pollRef.current = setInterval(poll, 5_000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [live?.broadcastId, token, headers])

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
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      return null
    } finally {
      setLoading(false)
    }
  }, [token, headers])

  // ── Auto-pilot: create + inject + start OBS ────────────────────────────────
  const startLiveAuto = useCallback(async () => {
    if (!token || !obsRef.current) return
    setLoading(true)
    setError(null)

    try {
      // 1. Create broadcast
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
      const liveData: LiveState = {
        broadcastId: data.broadcastId,
        rtmpUrl: data.rtmpUrl,
        streamKey: data.streamKey,
        watchUrl: data.watchUrl,
        lifeCycleStatus: 'created',
      }
      setLive(liveData)

      // 2. Inject RTMP into OBS
      await obsRef.current!.call('SetStreamServiceSettings', {
        streamServiceType: 'rtmp_custom',
        streamServiceSettings: {
          server: data.rtmpUrl,
          key: data.streamKey,
        },
      })
      showToast('OBS configuré automatiquement !')

      // 3. Start OBS stream
      await obsRef.current!.call('StartStream')
      showToast('Stream OBS démarré !')

      // 4. Wait for YouTube to detect stream, then transition
      setTimeout(async () => {
        try {
          const startRes = await fetch(
            `${API}/streaming/youtube/live/${data.broadcastId}/start`,
            { method: 'POST', headers: headers() },
          )
          if (startRes.ok) {
            setLive((prev) => prev ? { ...prev, lifeCycleStatus: 'live' } : prev)
          }
        } catch { /* polling will pick it up */ }
      }, 8_000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [token, headers, showToast])

  // ── Start live (backend only, manual mode) ─────────────────────────────────
  const startLiveManual = useCallback(async () => {
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
          setError('En attente de connexion OBS... Démarre le stream dans OBS d\'abord.')
        } else {
          throw new Error(msg || `Erreur ${res.status}`)
        }
        return
      }
      setLive((prev) => (prev ? { ...prev, lifeCycleStatus: 'live' } : prev))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [token, live, headers])

  // ── Stop live ──────────────────────────────────────────────────────────────
  const stopLive = useCallback(async () => {
    if (!token || !live) return
    setLoading(true)
    setError(null)
    try {
      // Stop OBS stream if connected
      if (obsRef.current && obsConnected) {
        try { await obsRef.current.call('StopStream') } catch { /* may already be stopped */ }
      }
      // Stop backend
      const res = await fetch(
        `${API}/streaming/youtube/live/${live.broadcastId}/stop`,
        { method: 'POST', headers: headers() },
      )
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as any).message ?? `Erreur ${res.status}`)
      }
      setLive(null)
      setObsStats(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [token, live, headers, obsConnected])

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

        {/* Live badge + timer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold" style={{ background: 'rgba(255,59,59,0.15)', color: '#FF3B3B' }}>
              <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: '#FF3B3B' }} />
              LIVE
            </span>
            <span className="text-white/70 text-sm font-mono">
              {obsStats?.timecode ? obsStats.timecode.split('.')[0] : fmtTime(elapsed)}
            </span>
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

        {/* OBS stream stats */}
        {obsConnected && obsStats && (
          <div className="flex items-center gap-4 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-xs">
            <span className="text-white/50">Bitrate</span>
            <span className="text-white/90 font-mono font-semibold">{obsStats.kbps} kbps</span>
            {obsStats.skippedFrames > 0 && (
              <>
                <span className="text-white/50">Frames perdues</span>
                <span className="text-yellow-400 font-mono">{obsStats.skippedFrames}</span>
              </>
            )}
            <span className="ml-auto text-emerald-400 text-[10px] font-bold uppercase">OBS connecté</span>
          </div>
        )}

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
  // STEP 2 — BROADCAST CREATED, MANUAL CONFIG (fallback)
  // ═══════════════════════════════════════════════════════════════════════════
  if (live && manualMode) {
    return (
      <div className="mt-4 p-5 rounded-xl bg-[#0d1020] border border-[#2a2d3e] space-y-5">
        {toast && <Toast message={toast} onDone={() => setToast(null)} />}

        <div className="flex items-center gap-2">
          <span className="text-lg">🔴</span>
          <div>
            <p className="text-white font-bold text-sm">Live créé — Configure OBS manuellement</p>
            <p className="text-white/40 text-xs">Copie les infos ci-dessous dans OBS Studio</p>
          </div>
        </div>

        {/* RTMP credentials */}
        <div className="space-y-3 p-4 rounded-xl bg-white/[0.03] border border-white/10">
          <CopyField label="URL du serveur" value={live.rtmpUrl} onCopy={() => showToast('URL copiée !')} />
          <CopyField label="Clé de stream" value={live.streamKey} onCopy={() => showToast('Clé copiée !')} />
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

        <button
          onClick={startLiveManual}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-bold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Spinner /> : '✓'}
          J&apos;ai configuré OBS — Aller en live
        </button>

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
  // STEP 1 — OBS CONNECTED, READY TO AUTO-START
  // ═══════════════════════════════════════════════════════════════════════════
  if (obsConnected) {
    return (
      <div className="mt-4 p-5 rounded-xl bg-[#0d1020] border border-emerald-500/30 space-y-4">
        {toast && <Toast message={toast} onDone={() => setToast(null)} />}

        {/* Connected badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              OBS connecté
            </span>
            <span className="text-white/40 text-xs">Configuration automatique activée</span>
          </div>
          <button
            onClick={disconnectObs}
            className="text-white/30 text-xs hover:text-white/60 transition"
          >
            Déconnecter
          </button>
        </div>

        {/* Info */}
        <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-3">
          <p className="text-emerald-300/80 text-xs">
            🚀 OBS sera configuré automatiquement. Clique sur le bouton ci-dessous — on s&apos;occupe du reste !
          </p>
        </div>

        {/* Start Live button */}
        <button
          onClick={startLiveAuto}
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-bold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
        >
          {loading ? <Spinner /> : <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />}
          Démarrer un live
        </button>

        <p className="text-white/30 text-[11px] text-center">
          OBS recevra l&apos;URL RTMP + clé automatiquement et démarrera le stream
        </p>

        {/* Manual mode fallback */}
        <button
          onClick={() => { setManualMode(true); createLive() }}
          className="w-full py-2 text-white/30 text-xs hover:text-white/50 transition"
        >
          Mode manuel (copier/coller)
        </button>

        {error && <p className="text-red-400 text-xs bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}
      </div>
    )
  }

  // ── Toggle tutorial ─────────────────────────────────────────────────────
  const toggleTutorial = useCallback(() => {
    setTutorialOpen((prev) => {
      const next = !prev
      localStorage.setItem('obs-tutorial-collapsed', next ? 'false' : 'true')
      return next
    })
  }, [])

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 0 — CONNECT OBS OR USE MANUAL MODE
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="mt-4 p-5 rounded-xl bg-[#0d1020] border border-[#2a2d3e] space-y-4">
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      {/* Header */}
      <div>
        <p className="text-white font-bold text-sm">YouTube Live</p>
        <p className="text-white/40 text-xs mt-0.5">Avant de continuer</p>
      </div>

      {/* Collapsible OBS Tutorial */}
      <div className="rounded-xl bg-white/[0.03] border border-white/10 overflow-hidden">
        <button
          onClick={toggleTutorial}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition"
        >
          <span className="text-white/70 text-xs font-bold flex items-center gap-2">
            🎬 Voir comment activer WebSocket dans OBS
          </span>
          <span className="text-white/30 text-xs transition-transform duration-200" style={{ transform: tutorialOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>
            ▶
          </span>
        </button>
        {tutorialOpen && (
          <div className="px-4 pb-4">
            <OBSTutorial />
          </div>
        )}
      </div>

      {/* Password + Connect */}
      <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4 space-y-3">
        <div className="space-y-1">
          <label className="text-white/50 text-xs font-medium">
            Mot de passe WebSocket <span className="text-white/30">(optionnel)</span>
          </label>
          <input
            type="password"
            value={obsPassword}
            onChange={(e) => setObsPassword(e.target.value)}
            placeholder="Laisser vide si pas de mot de passe"
            className="w-full px-3 py-2.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs placeholder:text-white/20 focus:outline-none focus:border-[#0097FC]/50 transition"
          />
        </div>

        <button
          onClick={connectObs}
          disabled={obsConnecting}
          className="w-full py-2.5 rounded-lg bg-[#0097FC]/15 border border-[#0097FC]/30 text-[#0097FC] text-sm font-bold hover:bg-[#0097FC]/25 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {obsConnecting ? <Spinner className="border-[#0097FC]/30 border-t-[#0097FC]" /> : '🔌'}
          Connecter OBS
        </button>

        {obsError && (
          <p className="text-red-400 text-xs bg-red-500/10 rounded-lg px-3 py-2">{obsError}</p>
        )}
      </div>

      {/* Manual mode fallback */}
      <div className="text-center">
        <button
          onClick={() => { setManualMode(true); createLive() }}
          disabled={loading}
          className="text-white/40 text-xs hover:text-white/60 transition"
        >
          → {loading ? 'Chargement...' : 'Mode manuel (sans OBS)'}
        </button>
      </div>

      {/* OBS download hint */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/5">
        <span className="text-white/30 text-xs">Pas encore OBS ?</span>
        <a href="https://obsproject.com" target="_blank" rel="noopener noreferrer" className="text-[#0097FC] text-xs font-semibold underline hover:text-[#0097FC]/80">
          Télécharger (gratuit)
        </a>
      </div>

      {error && <p className="text-red-400 text-xs bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}
    </div>
  )
}
