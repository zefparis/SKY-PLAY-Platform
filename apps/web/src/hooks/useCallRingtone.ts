'use client'

import { useRef, useCallback, useEffect } from 'react'

type RingtoneType = 'incoming' | 'ringback'

// incoming  : 480Hz + 620Hz (standard telephone ring), 1s ON / 0.5s OFF / 1s ON / 3s OFF
// ringback  : 440Hz + 480Hz, 0.6s ON, 2s OFF — tone that the caller hears while waiting

export function useCallRingtone() {
  const ctxRef   = useRef<AudioContext | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeRef = useRef(false)

  const clearTimer = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
  }

  const stopRing = useCallback(() => {
    activeRef.current = false
    clearTimer()
    if (ctxRef.current) {
      try { ctxRef.current.close() } catch {}
      ctxRef.current = null
    }
  }, [])

  /** Play a chord of oscillators for `duration` seconds */
  const chord = (ctx: AudioContext, freqs: number[], duration: number, gain = 0.12) => {
    const masterGain = ctx.createGain()
    masterGain.gain.setValueAtTime(0, ctx.currentTime)
    masterGain.gain.linearRampToValueAtTime(gain, ctx.currentTime + 0.02)
    masterGain.gain.setValueAtTime(gain, ctx.currentTime + duration - 0.02)
    masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration)
    masterGain.connect(ctx.destination)

    freqs.forEach((f) => {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = f
      osc.connect(masterGain)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + duration)
    })
  }

  const startRing = useCallback((type: RingtoneType) => {
    stopRing()
    activeRef.current = true

    const getCtx = (): AudioContext | null => {
      try {
        const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        if (!AudioCtx) return null
        const ctx = new AudioCtx()
        ctxRef.current = ctx
        return ctx
      } catch { return null }
    }

    if (type === 'incoming') {
      // Pattern : 1s ring · 0.5s silence · 1s ring · 3s silence · repeat
      const cycle = () => {
        if (!activeRef.current) return
        const ctx = getCtx()
        if (!ctx) return

        chord(ctx, [480, 620], 1.0)
        timerRef.current = setTimeout(() => {
          if (!activeRef.current) return
          const ctx2 = getCtx()
          if (!ctx2) return
          chord(ctx2, [480, 620], 1.0)
          timerRef.current = setTimeout(cycle, 3500) // 1s ring + 3s pause
        }, 1600) // 1s ring + 0.5s silence
      }
      cycle()
    } else {
      // Ringback pattern : 0.6s tone · 2s silence · repeat
      const cycle = () => {
        if (!activeRef.current) return
        const ctx = getCtx()
        if (!ctx) return
        chord(ctx, [440, 480], 0.6, 0.08)
        timerRef.current = setTimeout(cycle, 2800)
      }
      cycle()
    }
  }, [stopRing])

  // Auto-cleanup on unmount
  useEffect(() => () => stopRing(), [stopRing])

  return { startRing, stopRing }
}
