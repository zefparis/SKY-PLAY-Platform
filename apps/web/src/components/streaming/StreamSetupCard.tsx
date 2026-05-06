'use client'

import { useCallback, useMemo, useState } from 'react'
import { useI18n } from '@/components/i18n/I18nProvider'
import StreamPlatformGuide from './StreamPlatformGuide'

type StreamService = 'YOUTUBE' | 'TWITCH'

interface StreamSetupCardProps {
  matchId: string
  initialUrl?: string | null
  initialType?: StreamService | null
  onSubmit: (streamUrl: string) => Promise<void>
  disabled?: boolean
}

const YOUTUBE_RE = /(youtube\.com\/(watch\?v=|live\/|channel\/|@)|youtu\.be\/)/
const TWITCH_RE = /twitch\.tv\/[a-zA-Z0-9_]{4,25}/

function detectService(url: string): StreamService | null {
  if (YOUTUBE_RE.test(url)) return 'YOUTUBE'
  if (TWITCH_RE.test(url)) return 'TWITCH'
  return null
}

export default function StreamSetupCard({
  matchId: _matchId,
  initialUrl,
  initialType,
  onSubmit,
  disabled = false,
}: StreamSetupCardProps) {
  const { t } = useI18n()

  const [service, setService] = useState<StreamService>(initialType ?? 'YOUTUBE')
  const [url, setUrl] = useState(initialUrl ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [guideOpen, setGuideOpen] = useState(false)

  const validation = useMemo<{ valid: boolean; error: string | null }>(() => {
    const trimmed = url.trim()
    if (!trimmed) return { valid: false, error: null }

    const detected = detectService(trimmed)

    if (service === 'YOUTUBE') {
      if (!YOUTUBE_RE.test(trimmed)) {
        return { valid: false, error: t('streaming.setup.invalidYoutube') }
      }
    } else {
      if (!TWITCH_RE.test(trimmed)) {
        return { valid: false, error: t('streaming.setup.invalidTwitch') }
      }
    }

    // Warn if URL doesn't match selected platform but matches the other
    if (detected && detected !== service) {
      const wrongKey = service === 'YOUTUBE'
        ? 'streaming.setup.invalidYoutube'
        : 'streaming.setup.invalidTwitch'
      return { valid: false, error: t(wrongKey) }
    }

    return { valid: true, error: null }
  }, [url, service, t])

  const handleSubmit = useCallback(async () => {
    const trimmed = url.trim()
    if (!trimmed || !validation.valid) return
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit(trimmed)
      setUrl('')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }, [url, validation.valid, onSubmit])

  const placeholder = service === 'YOUTUBE'
    ? t('streaming.setup.placeholderYoutube')
    : t('streaming.setup.placeholderTwitch')

  return (
    <div className="space-y-2.5">
      {/* Segmented control */}
      <div className="flex items-center gap-1.5">
        <span className="text-white/50 text-[11px] font-medium mr-1">{t('streaming.setup.platformLabel')}</span>
        {(['YOUTUBE', 'TWITCH'] as const).map((s) => (
          <button
            key={s}
            onClick={() => { setService(s); setError(null) }}
            disabled={disabled}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
              service === s
                ? s === 'YOUTUBE'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                  : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'
            }`}
          >
            {s === 'YOUTUBE' ? '▶ YouTube' : '◆ Twitch'}
          </button>
        ))}
      </div>

      {/* Help link */}
      <button
        onClick={() => setGuideOpen(true)}
        className="text-[#0097FC] text-[11px] font-semibold hover:underline transition"
      >
        {t('streaming.setup.helpLink')}
      </button>

      {/* URL input + submit */}
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setError(null) }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
          placeholder={placeholder}
          disabled={disabled || submitting}
          className="flex-1 px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-xs placeholder:text-white/40 focus:outline-none focus:border-[#0097FC] min-w-0 disabled:opacity-50"
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || submitting || !validation.valid}
          className="px-3 py-2 bg-[#0097FC] hover:bg-[#0097FC]/80 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          {submitting ? t('streaming.setup.submitting') : `📡 ${t('streaming.setup.startButton')}`}
        </button>
      </div>

      {/* Validation error */}
      {(validation.error || error) && (
        <p className="text-xs text-red-400">{validation.error ?? error}</p>
      )}

      {/* Guide modal */}
      {guideOpen && (
        <StreamPlatformGuide service={service} onClose={() => setGuideOpen(false)} />
      )}
    </div>
  )
}
