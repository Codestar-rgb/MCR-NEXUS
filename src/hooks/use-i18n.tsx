'use client'

/**
 * i18n Hook
 *
 * 提供 t() 翻译函数和 locale 切换
 * 默认中文，持久化到 localStorage
 */

import * as React from 'react'
import { t as translate, type Locale } from '@/lib/i18n'

type I18nContextValue = {
  locale: Locale
  t: (key: string) => string
  setLocale: (locale: Locale) => void
}

const I18nContext = React.createContext<I18nContextValue>({
  locale: 'zh',
  t: (key) => key,
  setLocale: () => {},
})

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<Locale>('zh')

  React.useEffect(() => {
    const saved = localStorage.getItem('nexcube-locale') as Locale | null
    if (saved === 'zh' || saved === 'en') {
      setLocaleState(saved)
    }
  }, [])

  const setLocale = React.useCallback((next: Locale) => {
    setLocaleState(next)
    localStorage.setItem('nexcube-locale', next)
  }, [])

  const t = React.useCallback(
    (key: string) => translate(key, locale),
    [locale],
  )

  const value = React.useMemo(
    () => ({ locale, t, setLocale }),
    [locale, t, setLocale],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  return React.useContext(I18nContext)
}
