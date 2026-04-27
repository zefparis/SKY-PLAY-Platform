'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'sound_enabled'

type SoundType = 'message' | 'notification' | 'call'

// ────────────────────────────────────────────────────────────────────────────────
// Web Audio helpers (no audio files required)
// ────────────────────────────────────────────────────────────────────────────────

let sharedCtx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    if (!sharedCtx) {
      const Ctor = window.AudioContext || (window as any).webkitAudioContext
      if (!Ctor) return null
      sharedCtx = new Ctor()
    }
    // Resume context if suspended by autoplay policy (e.g. after first user gesture)
    if (sharedCtx.state === 'suspended') {
      sharedCtx.resume().catch(() => {})
    }
    return sharedCtx
  } catch {
    return null
  }
}

/**
 * Play a short tone with frequency sweep (start → end) over `duration` seconds.
 */
function playTone(
  ctx: AudioContext,
  startHz: number,
  endHz: number,
  duration: number,
  volume: number,
  startOffset = 0,
) {
  const t0 = ctx.currentTime + startOffset
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.type = 'sine'
  osc.frequency.setValueAtTime(startHz, t0)
  osc.frequency.exponentialRampToValueAtTime(Math.max(endHz, 0.001), t0 + duration)

  gain.gain.setValueAtTime(volume, t0)
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration)

  osc.start(t0)
  osc.stop(t0 + duration + 0.02)
}

/**
 * Play a 2-tone ringtone burst (≈0.6s) starting at offset.
 */
function playRingBurst(ctx: AudioContext, offset: number) {
  playTone(ctx, 880, 880, 0.18, 0.35, offset)
  playTone(ctx, 660, 660, 0.18, 0.35, offset + 0.22)
}

// ────────────────────────────────────────────────────────────────────────────────
// Hook
// ────────────────────────────────────────────────────────────────────────────────

export function useSoundNotification() {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true)
  // Hydrate from localStorage post-mount to avoid SSR mismatch
  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY)
      if (v !== null) setSoundEnabled(v !== 'false')
    } catch {}
  }, [])

  // Track active ringtone interval (call sound) so we can stop it
  const ringIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopRingtone = useCallback(() => {
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current)
      ringIntervalRef.current = null
    }
  }, [])

  const playSound = useCallback(
    (type: SoundType) => {
      if (!soundEnabled) return
      const ctx = getCtx()
      if (!ctx) return

      try {
        switch (type) {
          case 'message':
            // Short "pop": 800Hz → 600Hz, 0.15s
            playTone(ctx, 800, 600, 0.15, 0.3)
            break
          case 'notification':
            // Two-step "ding": 1000Hz then 1300Hz, 0.3s total
            playTone(ctx, 1000, 1000, 0.12, 0.35)
            playTone(ctx, 1320, 1320, 0.18, 0.35, 0.12)
            break
          case 'call':
            // Already ringing? Don't restart
            if (ringIntervalRef.current) return
            // Play immediately, then loop every 1.4s until stopped
            playRingBurst(ctx, 0)
            ringIntervalRef.current = setInterval(() => {
              const c = getCtx()
              if (!c) return
              playRingBurst(c, 0)
            }, 1400)
            break
        }
      } catch {
        // autoplay blocked or audio context error — fail silent
      }
    },
    [soundEnabled],
  )

  // If user disables sound, also stop any in-progress ringtone
  useEffect(() => {
    if (!soundEnabled) stopRingtone()
  }, [soundEnabled, stopRingtone])

  // Cleanup on unmount
  useEffect(() => {
    return () => stopRingtone()
  }, [stopRingtone])

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev
      try { localStorage.setItem(STORAGE_KEY, String(next)) } catch {}
      return next
    })
  }, [])

  return { playSound, stopSound: stopRingtone, soundEnabled, toggleSound }
}
