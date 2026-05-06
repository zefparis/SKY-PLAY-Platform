'use client'

import { useCallback, useState } from 'react'
import { useI18n } from '@/components/i18n/I18nProvider'

type StreamService = 'YOUTUBE' | 'TWITCH'
type DeviceKey = 'ps5' | 'xbox' | 'ios' | 'android' | 'pc'

interface StreamPlatformGuideProps {
  service: StreamService
  onClose: () => void
}

const DEVICES: { key: DeviceKey; icon: string }[] = [
  { key: 'ps5', icon: '🎮' },
  { key: 'xbox', icon: '🎮' },
  { key: 'ios', icon: '📱' },
  { key: 'android', icon: '📱' },
  { key: 'pc', icon: '💻' },
]

export default function StreamPlatformGuide({ service, onClose }: StreamPlatformGuideProps) {
  const { t } = useI18n()
  const [device, setDevice] = useState<DeviceKey | null>(null)

  const instructionKey = device
    ? `streaming.guide.${device}.${service.toLowerCase()}`
    : ''

  const handleBack = useCallback(() => setDevice(null), [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div
        className="relative w-full max-w-md rounded-2xl border border-white/15 p-6 space-y-5"
        style={{ background: '#0d1020' }}
      >
        {/* Close X */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white/40 hover:text-white text-lg transition"
          aria-label="Close"
        >
          ✕
        </button>

        <h2 className="text-white font-bold text-base">{t('streaming.guide.title')}</h2>

        {!device ? (
          <>
            <p className="text-white/60 text-sm">{t('streaming.guide.chooseDevice')}</p>
            <div className="grid grid-cols-1 gap-2">
              {DEVICES.map((d) => (
                <button
                  key={d.key}
                  onClick={() => setDevice(d.key)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-[#0097FC]/50 hover:bg-white/[0.07] text-white text-sm font-medium transition"
                >
                  <span className="text-lg">{d.icon}</span>
                  {t(`streaming.guide.device.${d.key}`)}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 text-white/50 text-xs">
              <span className="px-2 py-0.5 rounded bg-white/10 text-white/70 font-semibold">
                {t(`streaming.guide.device.${device}`)}
              </span>
              <span>×</span>
              <span className="px-2 py-0.5 rounded bg-white/10 text-white/70 font-semibold">
                {service}
              </span>
            </div>

            <p className="text-white/80 text-sm leading-relaxed whitespace-pre-line">
              {t(instructionKey)}
            </p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleBack}
                className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm font-semibold hover:bg-white/10 transition"
              >
                ← {t('streaming.guide.back')}
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-[#0097FC] text-white text-sm font-bold hover:bg-[#0097FC]/80 transition"
              >
                {t('streaming.guide.gotIt')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
