'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

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

interface Ad {
  id: string
  title: string
  mediaUrl: string
  targetUrl?: string
  advertiser: string
}

interface AdOverlayProps {
  game?: string
}

export default function AdOverlay({ game }: AdOverlayProps) {
  const [ad, setAd] = useState<Ad | null>(null)
  const [visible, setVisible] = useState(false)
  const [canClose, setCanClose] = useState(false)

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const token = getToken()
        const params = new URLSearchParams({ type: 'OVERLAY' })
        if (game) params.set('game', game)
        const res = await fetch(`${API}/ads/display?${params}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (res.ok) {
          const data = await res.json()
          if (data) { setAd(data); setVisible(true) }
        }
      } catch {}
    }
    fetch_()
  }, [game])

  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(() => setCanClose(true), 5000)
    return () => clearTimeout(timer)
  }, [visible])

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

  if (!ad || !visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="relative rounded-2xl overflow-hidden shadow-2xl border dark:border-white/10 border-[#00165F]/10"
        style={{ width: 300, maxWidth: '90vw' }}
      >
        {/* Close button — available after 5s */}
        <div className="absolute top-3 right-3 z-10">
          {canClose ? (
            <button
              onClick={() => setVisible(false)}
              className="w-8 h-8 flex items-center justify-center bg-black/60 hover:bg-black/90 text-white rounded-full transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <span className="w-8 h-8 flex items-center justify-center bg-black/40 text-white/70 text-xs font-bold rounded-full">
              5s
            </span>
          )}
        </div>

        {/* Ad label */}
        <div className="absolute top-3 left-3 z-10">
          <span className="px-2 py-0.5 bg-yellow-500/90 text-black text-[10px] font-black uppercase rounded tracking-wider">
            Publicité
          </span>
        </div>

        {/* Media (300×250) */}
        <div onClick={handleClick} className="cursor-pointer" style={{ height: 250 }}>
          <img
            src={ad.mediaUrl}
            alt={ad.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Footer */}
        <div className="px-4 py-3 dark:bg-[#001a6b] bg-white flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold dark:text-white text-[#00165F] truncate">{ad.title}</p>
            <p className="text-[11px] dark:text-white/50 text-[#00165F]/50">{ad.advertiser}</p>
          </div>
          <button
            onClick={handleClick}
            className="shrink-0 px-3 py-1.5 bg-[#0097FC] hover:bg-[#0086e0] text-white text-xs font-bold rounded-lg transition-colors"
          >
            Voir
          </button>
        </div>
      </div>
    </div>
  )
}
