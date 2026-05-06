'use client'

import { useState, useMemo } from 'react'
import { useI18n } from '@/components/i18n/I18nProvider'
import { StreamPlatformGuide } from './StreamPlatformGuide'

type StreamType = 'YOUTUBE' | 'TWITCH'

type Props = {
  matchId: string
  initialUrl?: string | null
  initialType?: StreamType | null
  onSubmit: (streamUrl: string) => Promise<void>
  disabled?: boolean
}

const YOUTUBE_REGEX = /(youtube\.com\/(watch\?v=|live\/|channel\/|@)|youtu\.be\/)/
const TWITCH_REGEX = /twitch\.tv\/[a-zA-Z0-9_]{4,25}/

export function StreamSetupCard({ matchId, initialUrl, initialType, onSubmit, disabled }: Props) {
  const { t } = useI18n()
  const [platform, setPlatform] = useState<StreamType>(initialType ?? 'YOUTUBE')
  const [url, setUrl] = useState(initialUrl ?? '')
  const [showGuide, setShowGuide] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const isValid = useMemo(() => {
    if (!url.trim()) return false
    if (platform === 'YOUTUBE') return YOUTUBE_REGEX.test(url)
    return TWITCH_REGEX.test(url)
  }, [url, platform])

  const errorMessage = useMemo(() => {
    if (!url.trim() || isValid) return null
    return platform === 'YOUTUBE'
      ? t('streaming.setup.invalidYoutube')
      : t('streaming.setup.invalidTwitch')
  }, [url, isValid, platform, t])

  const handleSubmit = async () => {
    if (!isValid) return
    setSubmitting(true)
    try {
      await onSubmit(url)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Segmented control */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => setPlatform('YOUTUBE')}
            style={segmentStyle(platform === 'YOUTUBE')}
          >
            YouTube
          </button>
          <button
            type="button"
            onClick={() => setPlatform('TWITCH')}
            style={segmentStyle(platform === 'TWITCH')}
          >
            Twitch
          </button>
        </div>

        {/* Help link */}
        <button
          type="button"
          onClick={() => setShowGuide(true)}
          style={{
            background: 'none', border: 'none', color: '#3ea6ff',
            cursor: 'pointer', textAlign: 'left', padding: 0, fontSize: 14,
          }}
        >
          {t('streaming.setup.helpLink')}
        </button>

        {/* URL input */}
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder={
            platform === 'YOUTUBE'
              ? t('streaming.setup.placeholderYoutube')
              : t('streaming.setup.placeholderTwitch')
          }
          disabled={disabled || submitting}
          style={{
            width: '100%', padding: 12, fontSize: 14,
            background: 'rgba(255,255,255,0.05)',
            border: errorMessage ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, color: '#fff',
          }}
        />

        {errorMessage && (
          <p style={{ color: '#ef4444', fontSize: 13, margin: 0 }}>{errorMessage}</p>
        )}

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isValid || submitting || disabled}
          style={{
            padding: 12, fontSize: 14, fontWeight: 600,
            background: isValid && !submitting ? '#3ea6ff' : 'rgba(255,255,255,0.1)',
            color: '#fff', border: 'none', borderRadius: 8,
            cursor: isValid && !submitting ? 'pointer' : 'not-allowed',
          }}
        >
          {submitting ? '...' : t('streaming.setup.startButton')}
        </button>
      </div>

      {showGuide && (
        <StreamPlatformGuide
          platform={platform}
          onClose={() => setShowGuide(false)}
        />
      )}
    </>
  )
}

function segmentStyle(active: boolean): React.CSSProperties {
  return {
    flex: 1, padding: 10, fontSize: 14, fontWeight: 600,
    background: active ? '#3ea6ff' : 'rgba(255,255,255,0.05)',
    color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer',
  }
}
