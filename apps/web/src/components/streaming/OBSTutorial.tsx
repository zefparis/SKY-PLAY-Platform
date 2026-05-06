'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface Step {
  label: string
  activeMenu?: string
  showDropdown?: boolean
  showModal?: boolean
  showDone?: boolean
}

const steps: Step[] = [
  {
    label: 'OBS est ouvert — clique sur Outils dans la barre de menu',
    activeMenu: 'Outils',
  },
  {
    label: 'Sélectionne Paramètres du serveur WebSocket',
    activeMenu: 'Outils',
    showDropdown: true,
  },
  {
    label: 'Coche Activer le serveur WebSocket → clique OK',
    showModal: true,
  },
  {
    label: 'Serveur WebSocket actif sur le port 4455 — retourne sur SkyPlay et clique Connecter OBS',
    showDone: true,
  },
]

const MENU_ITEMS = ['Fichier', 'Édition', 'Outils', 'Vue', 'Aide']
const AUTOPLAY_DELAY = 2200

export default function OBSTutorial() {
  const [current, setCurrent] = useState(0)
  const [checked, setChecked] = useState(false)
  const [portActive, setPortActive] = useState(false)
  const [okPulse, setOkPulse] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const manualRef = useRef(false)

  const step = steps[current]

  // ── Autoplay ───────────────────────────────────────────────────────────────
  const scheduleNext = useCallback(() => {
    if (manualRef.current) return
    if (current >= steps.length - 1) return

    timerRef.current = setTimeout(() => {
      setCurrent((prev) => Math.min(prev + 1, steps.length - 1))
    }, AUTOPLAY_DELAY)
  }, [current])

  useEffect(() => {
    scheduleNext()
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [scheduleNext])

  // ── Modal animation (step 3) ──────────────────────────────────────────────
  useEffect(() => {
    if (!step.showModal) {
      setChecked(false)
      setPortActive(false)
      setOkPulse(false)
      return
    }
    const t1 = setTimeout(() => setChecked(true), 600)
    const t2 = setTimeout(() => setPortActive(true), 900)
    const t3 = setTimeout(() => setOkPulse(true), 1200)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [step.showModal])

  // ── Navigation ────────────────────────────────────────────────────────────
  const goTo = (idx: number) => {
    manualRef.current = true
    if (timerRef.current) clearTimeout(timerRef.current)
    setCurrent(idx)
  }

  const prev = () => goTo(Math.max(0, current - 1))
  const next = () => goTo(Math.min(steps.length - 1, current + 1))
  const replay = () => {
    manualRef.current = false
    setCurrent(0)
  }

  const isLast = current === steps.length - 1

  // ── Cursor position per step ──────────────────────────────────────────────
  const cursorPositions: Record<number, { top: string; left: string }> = {
    0: { top: '44px', left: '178px' },
    1: { top: '90px', left: '210px' },
    2: { top: '140px', left: '260px' },
    3: { top: '50%', left: '50%' },
  }
  const cursorPos = cursorPositions[current] ?? { top: '50%', left: '50%' }

  return (
    <div style={{ maxWidth: 580 }} className="mx-auto select-none">
      {/* ── Simulated OBS window ──────────────────────────────────────────── */}
      <div
        style={{ background: '#1a1a2e', fontFamily: 'system-ui, sans-serif' }}
        className="rounded-xl border border-white/10 overflow-hidden shadow-2xl relative"
      >
        {/* Title bar */}
        <div
          className="flex items-center gap-2 px-3 py-2 border-b border-white/10"
          style={{ background: '#12122a' }}
        >
          <span className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} />
          <span className="w-3 h-3 rounded-full" style={{ background: '#febc2e' }} />
          <span className="w-3 h-3 rounded-full" style={{ background: '#28c840' }} />
          <span className="ml-3 text-white/50 text-[11px] font-medium tracking-wide">OBS Studio</span>
        </div>

        {/* Menu bar */}
        <div
          className="flex items-center gap-0 px-1 border-b border-white/10"
          style={{ background: '#16162e', height: 30 }}
        >
          {MENU_ITEMS.map((item) => {
            const isActive = step.activeMenu === item
            return (
              <div
                key={item}
                className="relative px-3 py-1 text-[12px] font-medium rounded-sm transition-colors duration-300"
                style={{
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.45)',
                  background: isActive ? '#6c3baa' : 'transparent',
                }}
              >
                {item}
              </div>
            )
          })}
        </div>

        {/* Main area */}
        <div className="relative" style={{ minHeight: 220 }}>
          {/* Scene placeholder */}
          <div className="absolute inset-0 flex items-center justify-center">
            {step.showDone ? (
              <div className="flex flex-col items-center gap-3 animate-[fadeSlideIn_0.4s_ease-out]">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center animate-pulse">
                  <span className="text-3xl">✓</span>
                </div>
                <p className="text-emerald-400 text-sm font-bold">WebSocket activé</p>
                <p className="text-white/40 text-xs">Port 4455 · Prêt</p>
              </div>
            ) : (
              <p className="text-white/10 text-xs uppercase tracking-widest">Scène principale</p>
            )}
          </div>

          {/* Dropdown (step 2) */}
          {step.showDropdown && (
            <div
              className="absolute z-20 animate-[fadeSlideIn_0.2s_ease-out]"
              style={{ top: 0, left: 60, background: '#222244', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', width: 260, padding: '4px 0' }}
            >
              {[
                'Scripts',
                'Paramètres du serveur WebSocket',
                'Mise à jour automatique',
              ].map((item) => {
                const highlight = item === 'Paramètres du serveur WebSocket'
                return (
                  <div
                    key={item}
                    className="px-4 py-1.5 text-[12px] transition-colors duration-200"
                    style={{
                      color: highlight ? '#fff' : 'rgba(255,255,255,0.5)',
                      background: highlight ? '#6c3baa' : 'transparent',
                    }}
                  >
                    {item}
                  </div>
                )
              })}
            </div>
          )}

          {/* Modal (step 3) */}
          {step.showModal && (
            <div className="absolute inset-0 z-30 flex items-center justify-center animate-[fadeSlideIn_0.3s_ease-out]" style={{ background: 'rgba(0,0,0,0.6)' }}>
              <div
                className="rounded-xl border border-white/15 p-5 space-y-4"
                style={{ background: '#1e1e3a', width: 320 }}
              >
                <p className="text-white text-sm font-bold">Paramètres WebSocket</p>

                {/* Checkbox */}
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <span
                    className="w-4 h-4 rounded border flex items-center justify-center transition-all duration-300"
                    style={{
                      borderColor: checked ? '#8b5cf6' : 'rgba(255,255,255,0.25)',
                      background: checked ? '#8b5cf6' : 'transparent',
                    }}
                  >
                    {checked && <span className="text-white text-[10px] font-bold">✓</span>}
                  </span>
                  <span className="text-white/80 text-xs">Activer le serveur WebSocket</span>
                </label>

                {/* Port field */}
                <div className="flex items-center gap-2">
                  <span className="text-white/40 text-xs">Port :</span>
                  <div
                    className="px-2 py-1 rounded text-xs font-mono transition-all duration-300"
                    style={{
                      background: portActive ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${portActive ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.1)'}`,
                      color: portActive ? '#c4b5fd' : 'rgba(255,255,255,0.3)',
                    }}
                  >
                    4455
                  </div>
                </div>

                {/* OK button */}
                <button
                  className={`w-full py-2 rounded-lg text-sm font-bold transition-all duration-300 ${okPulse ? 'animate-pulse' : ''}`}
                  style={{
                    background: okPulse ? '#6c3baa' : 'rgba(255,255,255,0.08)',
                    color: okPulse ? '#fff' : 'rgba(255,255,255,0.4)',
                    border: `1px solid ${okPulse ? '#8b5cf6' : 'rgba(255,255,255,0.1)'}`,
                  }}
                >
                  OK
                </button>
              </div>
            </div>
          )}

          {/* Animated cursor */}
          {!step.showDone && (
            <div
              className="absolute z-40 pointer-events-none"
              style={{
                top: cursorPos.top,
                left: cursorPos.left,
                transition: 'top 0.5s ease, left 0.5s ease',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M5 3L19 12L12 13L9 21L5 3Z" fill="white" stroke="rgba(0,0,0,0.4)" strokeWidth="1" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* ── Step label ────────────────────────────────────────────────────── */}
      <div className="mt-3 px-1">
        <p className="text-white/70 text-xs leading-relaxed min-h-[36px]">{step.label}</p>
      </div>

      {/* ── Dots + nav ────────────────────────────────────────────────────── */}
      <div className="mt-2 flex items-center justify-between px-1">
        {/* Dots */}
        <div className="flex items-center gap-1.5">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="transition-all duration-300"
              style={{
                width: i === current ? 18 : 6,
                height: 6,
                borderRadius: 3,
                background: i === current ? '#8b5cf6' : 'rgba(255,255,255,0.15)',
              }}
            />
          ))}
        </div>

        {/* Nav buttons */}
        <div className="flex items-center gap-2">
          {current > 0 && !isLast && (
            <button
              onClick={prev}
              className="text-white/30 text-[11px] hover:text-white/60 transition"
            >
              ← Précédent
            </button>
          )}
          {isLast ? (
            <button
              onClick={replay}
              className="text-[#8b5cf6] text-[11px] font-semibold hover:text-[#a78bfa] transition"
            >
              ↺ Revoir
            </button>
          ) : (
            <button
              onClick={next}
              className="text-[#8b5cf6] text-[11px] font-semibold hover:text-[#a78bfa] transition"
            >
              Suivant →
            </button>
          )}
        </div>
      </div>

    </div>
  )
}
