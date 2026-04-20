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

export default function AdBanner() {
  const [ad, setAd] = useState<Ad | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const token = getToken()
        const res = await fetch(`${API}/ads/display?type=BANNER`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (res.ok) setAd(await res.json())
      } catch {}
    }
    fetch_()
  }, [])

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

  if (!ad || dismissed) return null

  return (
    <div className="relative w-full" style={{ maxWidth: 728, margin: '0 auto' }}>
      <div className="relative rounded-xl overflow-hidden border dark:border-white/10 border-[#00165F]/10 shadow-md">
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-1.5 right-1.5 z-10 w-5 h-5 flex items-center justify-center bg-black/50 hover:bg-black/80 rounded-full text-white/80 hover:text-white transition-all"
        >
          <X className="w-3 h-3" />
        </button>
        <div className="absolute top-1.5 left-1.5 z-10">
          <span className="px-1.5 py-0.5 bg-yellow-500/90 text-black text-[9px] font-black uppercase rounded tracking-wider">
            Pub
          </span>
        </div>
        <div
          onClick={handleClick}
          className="cursor-pointer h-[90px] flex items-center overflow-hidden"
        >
          <img
            src={ad.mediaUrl}
            alt={ad.title}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  )
}
