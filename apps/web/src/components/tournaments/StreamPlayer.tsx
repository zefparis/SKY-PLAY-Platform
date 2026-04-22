'use client'

import { useMemo } from 'react'

type StreamType = 'YOUTUBE' | 'TWITCH' | 'FACEBOOK'

interface StreamPlayerProps {
  streamUrl: string
  streamType: StreamType
}

function extractYouTubeId(url: string): string | null {
  const regexps = [
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ]
  for (const re of regexps) {
    const m = url.match(re)
    if (m) return m[1]
  }
  return null
}

function extractTwitchChannel(url: string): string | null {
  const m = url.match(/twitch\.tv\/([a-zA-Z0-9_]+)/)
  return m ? m[1] : null
}

export default function StreamPlayer({ streamUrl, streamType }: StreamPlayerProps) {
  const embedUrl = useMemo(() => {
    switch (streamType) {
      case 'YOUTUBE': {
        const id = extractYouTubeId(streamUrl)
        return id ? `https://www.youtube.com/embed/${id}?autoplay=1&mute=1` : null
      }
      case 'TWITCH': {
        const channel = extractTwitchChannel(streamUrl)
        if (!channel) return null
        const parent = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
        return `https://player.twitch.tv/?channel=${channel}&parent=${parent}&autoplay=true&muted=false`
      }
      case 'FACEBOOK': {
        return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(streamUrl)}&show_text=false`
      }
      default:
        return null
    }
  }, [streamUrl, streamType])

  if (!embedUrl) {
    return (
      <div className="w-full aspect-video rounded-xl overflow-hidden border border-[#2a2d3e] bg-black flex items-center justify-center text-white/50 text-sm">
        URL de stream invalide
      </div>
    )
  }

  return (
    <div className="w-full aspect-video rounded-xl overflow-hidden border border-[#2a2d3e] bg-black">
      <iframe
        src={embedUrl}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        className="w-full h-full"
        frameBorder="0"
        title={`${streamType} stream`}
      />
    </div>
  )
}
