'use client'

import { useEffect, useMemo, useState } from 'react'
import { MoonStar, SunMedium } from 'lucide-react'
import { useLocale } from 'next-intl'
import { cn } from '@/lib/utils'

type Theme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'nexdoc-theme'
const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)'

function resolveSystemTheme(): Theme {
  return window.matchMedia(DARK_MEDIA_QUERY).matches ? 'dark' : 'light'
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
}

function readStoredTheme(): Theme | null {
  const value = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (value === 'light' || value === 'dark') {
    return value
  }
  return null
}

export function ThemeToggle() {
  const locale = useLocale()
  const [theme, setTheme] = useState<Theme>('dark')
  const [mounted, setMounted] = useState(false)

  const labels = useMemo(
    () =>
      locale === 'zh'
        ? {
            switchToLight: '切换到浅色模式',
            switchToDark: '切换到深色模式',
          }
        : {
            switchToLight: 'Switch to light theme',
            switchToDark: 'Switch to dark theme',
          },
    [locale]
  )

  useEffect(() => {
    const media = window.matchMedia(DARK_MEDIA_QUERY)
    const storedTheme = readStoredTheme()
    const initialTheme = storedTheme ?? resolveSystemTheme()
    setTheme(initialTheme)
    applyTheme(initialTheme)
    setMounted(true)

    const onSystemThemeChange = (event: MediaQueryListEvent) => {
      if (readStoredTheme()) return
      const nextTheme: Theme = event.matches ? 'dark' : 'light'
      setTheme(nextTheme)
      applyTheme(nextTheme)
    }

    media.addEventListener('change', onSystemThemeChange)
    return () => media.removeEventListener('change', onSystemThemeChange)
  }, [])

  const toggleTheme = () => {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    applyTheme(nextTheme)
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
  }

  const ariaLabel = theme === 'dark' ? labels.switchToLight : labels.switchToDark
  const isDark = mounted ? theme === 'dark' : true
  const Icon = isDark ? SunMedium : MoonStar

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        'inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md transition-colors',
        isDark
          ? 'text-[var(--accent)] hover:text-[var(--accent)]'
          : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]',
        'hover:bg-[var(--bg-elevated)]'
      )}
      aria-label={ariaLabel}
      title={ariaLabel}
      aria-pressed={isDark}
    >
      <Icon className="h-[18px] w-[18px]" />
    </button>
  )
}
