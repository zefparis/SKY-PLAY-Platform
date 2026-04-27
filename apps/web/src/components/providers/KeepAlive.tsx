'use client'

import { useEffect } from 'react'
import { startKeepAlive } from '@/lib/keepalive'

export default function KeepAlive() {
  useEffect(() => {
    const stop = startKeepAlive()
    return stop
  }, [])
  return null
}
