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
    /youtube\.com\/watch\?(?:[^#]*&)?v=([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ]
  for (const re of regexps) {
    const m = url.match(re)
    if (m) return m[1]
  }
  return null
}

function extractYouTubeChannel(url: string): string | null {
  // Live stream by channel id: https://www.youtube.com/channel/UCxxx/live  or  /live_stream?channel=UCxxx
  const m = url.match(/youtube\.com\/(?:channel\/(UC[a-zA-Z0-9_-]{20,})|live_stream\?channel=(UC[a-zA-Z0-9_-]{20,}))/)
  return m ? (m[1] ?? m[2] ?? null) : null
}

function extractTwitchChannel(url: string): string | null {
  const m = url.match(/twitch\.tv\/([a-zA-Z0-9_]+)/)
  return m ? m[1] : null
}

export default function StreamPlayer({ streamUrl, streamType }: StreamPlayerProps) {
  const embedUrl = useMemo(() => {
    switch (streamType) {
      case 'YOUTUBE': {
        const params = 'autoplay=1&mute=0&rel=0&modestbranding=1&enablejsapi=1'
        const id = extractYouTubeId(streamUrl)
        if (id) return `https://www.youtube.com/embed/${id}?${params}`
        const channelId = extractYouTubeChannel(streamUrl)
        if (channelId) return `https://www.youtube.com/embed/live_stream?channel=${channelId}&${params}`
        return null
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
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="w-full h-full"
        frameBorder="0"
        title={`${streamType} stream`}
        onError={(e) => {
          const target = e.currentTarget;
          target.style.display = 'none';
          target.insertAdjacentHTML(
            'afterend',
            '<div class="w-full h-full flex items-center justify-center text-white/50 text-sm">Impossible de charger le stream</div>',
          );
        }}
      />
    </div>
  )
}
