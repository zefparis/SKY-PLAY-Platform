'use client'

import { useI18n } from './I18nProvider'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export default function LanguageSwitch({ className }: { className?: string }) {
  const { lang, setLang, t } = useI18n()

  return (
    <div className={cn('inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 p-1', className)}>
      <Button
        type="button"
        size="sm"
        variant={lang === 'en' ? 'primary' : 'ghost'}
        className="h-8 px-2"
        onClick={() => setLang('en')}
      >
        {t('nav.lang.en')}
      </Button>
      <Button
        type="button"
        size="sm"
        variant={lang === 'fr' ? 'primary' : 'ghost'}
        className="h-8 px-2"
        onClick={() => setLang('fr')}
      >
        {t('nav.lang.fr')}
      </Button>
    </div>
  )
}
