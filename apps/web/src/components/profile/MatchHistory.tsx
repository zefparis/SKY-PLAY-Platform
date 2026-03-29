'use client'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { useI18n } from '@/components/i18n/I18nProvider'

export type MatchItem = {
  id: string
  opponent: string
  result: 'WIN' | 'LOSS'
  date: string
  game: string
}

export default function MatchHistory({ matches }: { matches: MatchItem[] }) {
  const { t } = useI18n()
  return (
    <Card variant="glass">
      <div className="mb-4 sm:mb-6 flex items-center justify-between gap-4">
        <h2 className="title-tech text-primary dark:text-white text-lg sm:text-xl font-extrabold">{t('match.history')}</h2>
        <p className="text-primary/70 dark:text-white/60 text-xs sm:text-sm">{t('match.last')} {matches.length}</p>
      </div>

      <div className="space-y-3">
        {matches.map((m) => (
          <div
            key={m.id}
            className="rounded-lg border border-primary/10 dark:border-white/10 bg-white/40 dark:bg-black/20 px-3 py-3 sm:px-4 transition duration-200 hover:border-primary/20 dark:hover:border-white/20"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-primary dark:text-white font-semibold text-sm sm:text-base break-words">{m.game}</p>
                <p className="text-primary/70 dark:text-white/60 text-xs sm:text-sm break-words">vs {m.opponent} • {m.date}</p>
              </div>
              <div className="flex justify-start sm:justify-end">
                <Badge variant={m.result === 'WIN' ? 'success' : 'danger'} className="shrink-0 px-2.5 py-1 text-[10px] sm:px-3 sm:text-xs">{m.result}</Badge>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
