'use client'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { useI18n } from '@/components/i18n/I18nProvider'

export type Achievement = {
  id: string
  title: string
  description: string
  highlight?: boolean
}

export default function Achievements({ achievements }: { achievements: Achievement[] }) {
  const { t } = useI18n()
  return (
    <Card variant="glass">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h2 className="title-tech text-primary dark:text-white text-xl font-extrabold">{t('achievements.title')}</h2>
        <Badge variant="info">{t('achievements.unlocked')}</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements.map((a) => (
          <div
            key={a.id}
            className="rounded-lg border border-primary/10 dark:border-white/10 bg-white/40 dark:bg-black/20 p-4 transition duration-200 hover:border-secondary/35 hover:shadow-glow-blue"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-primary dark:text-white font-semibold">{a.title}</p>
                <p className="text-primary/70 dark:text-white/60 text-sm mt-1">{a.description}</p>
              </div>
              <Badge variant={a.highlight ? 'danger' : 'info'}>
                {a.highlight ? 'PRO' : 'OK'}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
