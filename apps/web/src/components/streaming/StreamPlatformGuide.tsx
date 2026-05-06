'use client'

import { useState } from 'react'
import { useI18n } from '@/components/i18n/I18nProvider'

type StreamType = 'YOUTUBE' | 'TWITCH'
type Device = 'ps5' | 'xbox' | 'ios' | 'android' | 'pc'

type Props = {
  platform: StreamType
  onClose: () => void
}

const DEVICES: Device[] = ['ps5', 'xbox', 'ios', 'android', 'pc']

export function StreamPlatformGuide({ platform, onClose }: Props) {
  const { t } = useI18n()
  const [device, setDevice] = useState<Device | null>(null)

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#1a1a2e', borderRadius: 16, padding: 24,
          maxWidth: 480, width: '100%', maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        <h2 style={{ margin: '0 0 16px', fontSize: 20, color: '#fff' }}>
          {t('streaming.guide.title')}
        </h2>

        {!device && (
          <>
            <p style={{ color: 'rgba(255,255,255,0.6)', margin: '0 0 16px' }}>
              {t('streaming.guide.chooseDevice')}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {DEVICES.map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDevice(d)}
                  style={{
                    padding: 14, fontSize: 15, textAlign: 'left',
                    background: 'rgba(255,255,255,0.05)', color: '#fff',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                    cursor: 'pointer',
                  }}
                >
                  {t(`streaming.guide.devices.${d}`)}
                </button>
              ))}
            </div>
          </>
        )}

        {device && (
          <>
            <button
              type="button"
              onClick={() => setDevice(null)}
              style={{
                background: 'none', border: 'none', color: '#3ea6ff',
                cursor: 'pointer', padding: 0, marginBottom: 12, fontSize: 14,
              }}
            >
              ← {t('streaming.guide.chooseDevice')}
            </button>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: '#fff' }}>
              {t(`streaming.guide.devices.${device}`)} + {platform === 'YOUTUBE' ? 'YouTube' : 'Twitch'}
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, margin: '0 0 20px' }}>
              {t(`streaming.guide.instructions.${device}.${platform === 'YOUTUBE' ? 'youtube' : 'twitch'}`)}
            </p>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: '100%', padding: 12, fontSize: 15, fontWeight: 600,
                background: '#3ea6ff', color: '#fff', border: 'none',
                borderRadius: 8, cursor: 'pointer',
              }}
            >
              {t('streaming.guide.gotIt')}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
