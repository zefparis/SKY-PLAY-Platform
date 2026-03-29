'use client'

import { useEffect, useState } from 'react'

type DiscordStatus = 'online' | 'idle' | 'dnd' | 'offline' | null

export function DiscordStatusIndicator({ userId }: { userId: string }) {
  const [status, setStatus] = useState<DiscordStatus>(null)

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(`https://skyplayapi-production.up.railway.app/users/${userId}/discord-status`)
        if (response.ok) {
          const data = await response.json()
          setStatus(data.status)
        }
      } catch (error) {
        console.error('Failed to fetch Discord status:', error)
      }
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 60000) // Refresh every 60s

    return () => clearInterval(interval)
  }, [userId])

  if (!status || status === 'offline') return null

  const colors = {
    online: 'bg-emerald-400',
    idle: 'bg-yellow-400',
    dnd: 'bg-red-400',
  }

  return (
    <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 ${colors[status]} rounded-full ring-2 dark:ring-[#030b1a] ring-white`} />
  )
}
