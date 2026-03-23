'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { SupportedLang, Translations } from './translations'
import { translations } from './translations'

type I18nContextValue = {
  lang: SupportedLang
  setLang: (lang: SupportedLang) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

const STORAGE_KEY = 'skyplay.lang'

function isSupportedLang(value: unknown): value is SupportedLang {
  return value === 'en' || value === 'fr'
}

function getBrowserLang(): SupportedLang {
  if (typeof navigator === 'undefined') return 'en'
  const raw = navigator.language?.toLowerCase() ?? 'en'
  if (raw.startsWith('fr')) return 'fr'
  return 'en'
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<SupportedLang>('en')

  useEffect(() => {
    // Hydratation côté client: restaurer la langue choisie.
    try {
      const fromStorage = localStorage.getItem(STORAGE_KEY)
      if (isSupportedLang(fromStorage)) {
        setLangState(fromStorage)
        return
      }
    } catch {
      // ignore
    }

    setLangState(getBrowserLang())
  }, [])

  useEffect(() => {
    // Mettre à jour l'attribut lang côté DOM
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang
    }
  }, [lang])

  const setLang = useCallback((next: SupportedLang) => {
    setLangState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // ignore
    }
  }, [])

  const dict: Translations = useMemo(() => translations[lang], [lang])

  const t = useCallback(
    (key: string) => {
      return dict[key] ?? translations.en[key] ?? key
    },
    [dict]
  )

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within an I18nProvider')
  return ctx
}
