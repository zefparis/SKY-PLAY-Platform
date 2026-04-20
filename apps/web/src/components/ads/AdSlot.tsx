'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Play } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

type AdType = 'VIDEO_PRE' | 'VIDEO_POST' | 'BANNER' | 'OVERLAY' | 'POPUP' | 'NATIVE' | 'SPONSORED_EVENT'

interface Ad {
  id: string
  title: string
  type: AdType
  mediaUrl: string
  targetUrl?: string
  advertiser: string
}

interface AdSlotProps {
  type: AdType
  game?: string
  onDismiss?: () => void
  className?: string
}

function getToken() {
  if (typeof window === 'undefined') return ''
  try {
    const s = window.localStorage.getItem('skyplay-auth')
    if (!s) return ''
    const p = JSON.parse(s)
    const t = p?.state?.tokens || p?.tokens
    return t?.idToken || t?.accessToken || ''
  } catch { return '' }
}

export default function AdSlot({ type, game, onDismiss, className = '' }: AdSlotProps) {
  const [ad, setAd] = useState<Ad | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const [canSkip, setCanSkip] = useState(false)

  const fetchAd = useCallback(async () => {
    try {
      const token = getToken()
      const params = new URLSearchParams({ type })
      if (game) params.set('game', game)
      const res = await fetch(`${API}/ads/display?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) {
        const data = await res.json()
        setAd(data)
      }
    } catch {}
  }, [type, game])

  useEffect(() => { fetchAd() }, [fetchAd])

  useEffect(() => {
    if (!ad || canSkip) return
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { setCanSkip(true); clearInterval(timer); return 0 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [ad, canSkip])

  const handleClick = async () => {
    if (!ad) return
    try {
      const token = getToken()
      await fetch(`${API}/ads/${ad.id}/click`, {
        method: 'POST',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      })
    } catch {}
    if (ad.targetUrl) window.open(ad.targetUrl, '_blank', 'noopener')
  }

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss?.()
  }

  if (!ad || dismissed) return null

  const isVideo = type === 'VIDEO_PRE' || type === 'VIDEO_POST'

  return (
    <div className={`relative rounded-2xl overflow-hidden border dark:border-white/10 border-[#00165F]/10 ${className}`}>
      {/* Skip/close button */}
      <div className="absolute top-3 right-3 z-10">
        {canSkip ? (
          <button
            onClick={handleDismiss}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-black/60 hover:bg-black/80 text-white text-xs font-bold rounded-full transition-all backdrop-blur-sm"
          >
            <X className="w-3 h-3" />
            Passer
          </button>
        ) : (
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-black/60 text-white text-xs font-bold rounded-full backdrop-blur-sm">
            <Play className="w-3 h-3" />
            {countdown}s
          </span>
        )}
      </div>

      {/* Ad label */}
      <div className="absolute top-3 left-3 z-10">
        <span className="px-2 py-0.5 bg-yellow-500/90 text-black text-[10px] font-black uppercase rounded tracking-wider">
          Publicité
        </span>
      </div>

      {/* Media */}
      <div onClick={handleClick} className="cursor-pointer">
        {isVideo && ad.mediaUrl.match(/\.(mp4|webm|ogg)$/i) ? (
          <video
            src={ad.mediaUrl}
            autoPlay
            muted
            playsInline
            className="w-full max-h-64 object-cover"
          />
        ) : (
          <img
            src={ad.mediaUrl}
            alt={ad.title}
            className="w-full object-cover"
          />
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 dark:bg-white/5 bg-[#00165F]/5 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold dark:text-white/80 text-[#00165F]/80">{ad.title}</p>
          <p className="text-[10px] dark:text-white/40 text-[#00165F]/40">{ad.advertiser}</p>
        </div>
        <button
          onClick={handleClick}
          className="px-3 py-1 bg-[#0097FC] hover:bg-[#0086e0] text-white text-xs font-bold rounded-lg transition-colors"
        >
          En savoir plus
        </button>
      </div>
    </div>
  )
}
