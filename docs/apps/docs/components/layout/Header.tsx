'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Menu, Search, X, Languages, Command, ChevronDown } from 'lucide-react'
import { defaultLocale, localeNames, locales } from '@/lib/i18n'
import { getDocByHref, hasLocalizedDoc } from '@/lib/docs'
import { siteConfig } from '@/lib/site'
import { SearchDialog } from '@/components/search/SearchDialog'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { cn } from '@/lib/utils'

interface HeaderProps {
  onMobileMenuToggle?: () => void
  isMobileMenuOpen?: boolean
  showSidebarToggle?: boolean
}

function normalizePrefix(prefix: string): string {
  return prefix.replace(/^\/+|\/+$/g, '')
}

function matchesPrefix(slug: string, prefix: string): boolean {
  const normalizedPrefix = normalizePrefix(prefix)
  if (!normalizedPrefix) {
    return false
  }
  return slug === normalizedPrefix || slug.startsWith(`${normalizedPrefix}/`)
}

export function Header({
  onMobileMenuToggle,
  isMobileMenuOpen,
  showSidebarToggle = true,
}: HeaderProps) {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const localeMenuRef = useRef<HTMLDivElement>(null)
  const navMenuRef = useRef<HTMLDivElement>(null)

  const [showNavMenu, setShowNavMenu] = useState(false)
  const [showLocaleMenu, setShowLocaleMenu] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark')
  const currentDoc = useMemo(() => getDocByHref(pathname), [pathname])

  const navEntries = useMemo(() => {
    return siteConfig.nav.map((entry) => ({
      ...entry,
      displayLabel: locale === 'zh' && entry.labelZh ? entry.labelZh : entry.label,
      fullHref: entry.external ? entry.href : `/${locale}${entry.href}`,
    }))
  }, [locale])
  const searchButtonLabel = useMemo(
    () => (locale === 'zh' ? '搜索文档...' : 'Search docs...'),
    [locale]
  )
  const docsBadgeLabel = useMemo(
    () => (locale === 'zh' ? '文档' : 'Documentation'),
    [locale]
  )
  const navMenuLabel = useMemo(
    () => (locale === 'zh' ? '导航' : 'Navigation'),
    [locale]
  )
  const brandAlt = siteConfig.assets?.brand?.alt || siteConfig.brand?.alt || siteConfig.name
  const brandIconDefault = siteConfig.assets?.brand?.icon || siteConfig.brand?.icon
  const brandIconLight = siteConfig.assets?.brand?.iconLight || siteConfig.brand?.iconLight
  const brandIconDark = siteConfig.assets?.brand?.iconDark || siteConfig.brand?.iconDark
  const brandIcon = resolvedTheme === 'dark'
    ? brandIconDark || brandIconDefault || brandIconLight
    : brandIconLight || brandIconDefault || brandIconDark
  const brandLogo = siteConfig.assets?.brand?.logo || siteConfig.brand?.logo

  // Global keyboard shortcut for search
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setShowSearch(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    const resolveTheme = (): 'light' | 'dark' => {
      return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
    }

    const syncTheme = () => {
      setResolvedTheme(resolveTheme())
    }

    syncTheme()

    const observer = new MutationObserver((records) => {
      if (records.some((record) => record.attributeName === 'data-theme')) {
        syncTheme()
      }
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })

    return () => observer.disconnect()
  }, [])

  // Close locale menu on route change
  useEffect(() => {
    setShowNavMenu(false)
    setShowLocaleMenu(false)
  }, [pathname])

  // Close locale menu on outside click
  useEffect(() => {
    if (!showLocaleMenu) return
    const onClick = (e: MouseEvent) => {
      if (localeMenuRef.current && !localeMenuRef.current.contains(e.target as Node)) {
        setShowLocaleMenu(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [showLocaleMenu])

  // Close center nav menu on outside click
  useEffect(() => {
    if (!showNavMenu) return
    const onClick = (e: MouseEvent) => {
      if (navMenuRef.current && !navMenuRef.current.contains(e.target as Node)) {
        setShowNavMenu(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [showNavMenu])

  const switchLocale = (targetLocale: string) => {
    setShowLocaleMenu(false)
    const segments = pathname.split('/').filter(Boolean)
    const localeIndex = segments.findIndex((s) =>
      locales.includes(s as (typeof locales)[number])
    )
    if (localeIndex === -1) {
      router.push(`/${targetLocale}`, { scroll: false })
      return
    }
    const leadingSegments = segments.slice(0, localeIndex)
    const remaining = segments.slice(localeIndex + 1)
    if (remaining[0] === 'docs') {
      const slug = remaining.slice(1).join('/')
      if (slug && !hasLocalizedDoc(targetLocale, slug)) {
        router.push(`/${[...leadingSegments, targetLocale, 'docs'].join('/')}` as any, { scroll: false })
        return
      }
    }
    router.push(`/${[...leadingSegments, targetLocale, ...remaining].join('/')}` as any, { scroll: false })
  }

  const isNavEntryActive = (entry: (typeof navEntries)[number]) => {
    const entryPrefixes = entry.matchPrefixes ?? []
    if (currentDoc) {
      return (
        entryPrefixes.length > 0
        && entryPrefixes.some((prefix) => matchesPrefix(currentDoc.slug, prefix))
      )
    }
    return pathname.startsWith(entry.fullHref)
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg-primary)]/95 backdrop-blur-sm">
      <div className="flex h-14 items-center px-4 lg:px-6">
        {/* Left: hamburger + logo - width matches sidebar */}
        <div className="flex items-center gap-3 lg:w-[320px]">
          {showSidebarToggle && (
            <button
              type="button"
              onClick={onMobileMenuToggle}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-tertiary)] transition hover:text-[var(--text-primary)] lg:hidden"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          )}
          <Link href={`/${locale || defaultLocale}` as any} className="flex min-w-0 items-center gap-2.5 transition-opacity hover:opacity-80">
            {brandIcon ? (
              <img src={brandIcon} alt={`${brandAlt} icon`} className="h-7 w-7 object-contain" />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--text-primary)] text-[var(--bg-primary)]">
                <Command className="h-4 w-4" />
              </div>
            )}
            {brandLogo ? (
              <img src={brandLogo} alt={brandAlt} className="h-5 w-auto object-contain" />
            ) : (
              <span
                className="max-w-[340px] truncate whitespace-nowrap text-[16px] font-bold tracking-tight text-[var(--text-primary)] sm:max-w-[420px]"
                title={siteConfig.name}
              >
                {siteConfig.name}
              </span>
            )}
            <span className="hidden rounded-full bg-[var(--accent-subtle)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--accent)] sm:inline">
              {docsBadgeLabel}
            </span>
          </Link>
        </div>

        {/* Center: nav entries */}
        <div className="flex min-w-0 flex-1 justify-center">
          {navEntries.length > 0 && (
            <>
              <nav className="hidden items-center gap-1.5 whitespace-nowrap xl:flex">
                {navEntries.map((entry) => {
                  const isActive = isNavEntryActive(entry)
                  return entry.external ? (
                    <a
                      key={entry.href}
                      href={entry.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-8 shrink-0 whitespace-nowrap items-center justify-center rounded-full px-3.5 text-[14px] font-medium text-[var(--text-tertiary)] transition-all duration-200 hover:bg-[var(--bg-elevated)] hover:text-[var(--text-secondary)]"
                    >
                      {entry.displayLabel}
                    </a>
                  ) : (
                    <Link
                      key={entry.href}
                      href={entry.fullHref as any}
                      className={cn(
                        'inline-flex h-8 shrink-0 whitespace-nowrap items-center justify-center rounded-full px-3.5 text-[14px] font-medium transition-all duration-200',
                        isActive
                          ? 'bg-[var(--accent-subtle)] text-[var(--text-primary)]'
                          : 'text-[var(--text-tertiary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-secondary)]'
                      )}
                    >
                      {entry.displayLabel}
                    </Link>
                  )
                })}
              </nav>

              <div className="relative hidden md:block xl:hidden" ref={navMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    setShowLocaleMenu(false)
                    setShowNavMenu((open) => !open)
                  }}
                  className={cn(
                    'inline-flex h-8 items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] px-3 text-[13px] font-medium text-[var(--text-tertiary)] transition-colors',
                    showNavMenu
                      ? 'border-[var(--border-hover)] text-[var(--text-primary)]'
                      : 'hover:border-[var(--border-hover)] hover:text-[var(--text-primary)]'
                  )}
                  aria-haspopup="menu"
                  aria-expanded={showNavMenu}
                  aria-label={navMenuLabel}
                >
                  <span>{navMenuLabel}</span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform duration-200',
                      showNavMenu ? 'rotate-180' : 'rotate-0'
                    )}
                  />
                </button>

                {showNavMenu && (
                  <div className="absolute left-1/2 top-full z-50 mt-2 w-[240px] -translate-x-1/2 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-1.5 shadow-xl">
                    <div className="flex flex-col gap-1">
                      {navEntries.map((entry) => {
                        const isActive = isNavEntryActive(entry)
                        return entry.external ? (
                          <a
                            key={entry.href}
                            href={entry.href}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => setShowNavMenu(false)}
                            className="flex w-full items-center rounded-lg px-3 py-2 text-[13px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                          >
                            {entry.displayLabel}
                          </a>
                        ) : (
                          <Link
                            key={entry.href}
                            href={entry.fullHref as any}
                            onClick={() => setShowNavMenu(false)}
                            className={cn(
                              'flex w-full items-center rounded-lg px-3 py-2 text-[13px] font-medium transition-colors',
                              isActive
                                ? 'bg-[var(--accent-subtle)] text-[var(--text-primary)]'
                                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
                            )}
                          >
                            {entry.displayLabel}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right: search + theme + github + locale */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSearch(true)}
            className="group flex h-8 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] px-3 text-[13px] text-[var(--text-tertiary)] transition-all hover:border-[var(--border-hover)] hover:text-[var(--text-primary)] sm:w-44 xl:w-56"
          >
            <Search className="h-4 w-4" />
            <span className="hidden flex-1 text-left sm:inline">{searchButtonLabel}</span>
            <kbd className="hidden rounded px-1.5 py-0.5 text-[11px] font-sans font-medium text-[var(--text-tertiary)] transition-colors group-hover:text-[var(--text-primary)] sm:inline">
              ⌘K
            </kbd>
          </button>

          <ThemeToggle />

          {/* GitHub */}
          <a
            href={siteConfig.github}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
            aria-label="GitHub"
          >
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
          </a>

          {/* Locale switcher */}
          <div className="relative" ref={localeMenuRef}>
            <button
              type="button"
              onClick={() => {
                setShowNavMenu(false)
                setShowLocaleMenu((o) => !o)
              }}
              className={cn(
                'inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md transition-colors',
                showLocaleMenu
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)]'
                  : 'text-[var(--text-tertiary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
              )}
              aria-label="Switch language"
            >
              <Languages className="h-[18px] w-[18px]" />
            </button>

            {showLocaleMenu && (
              <div className="absolute right-0 mt-2 min-w-[160px] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-1.5 shadow-xl">
                <div className="flex flex-col gap-1">
                  {locales.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => switchLocale(t)}
                      className={cn(
                        'flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[13px] transition-colors',
                        locale === t
                          ? 'text-[var(--text-primary)] bg-[var(--accent-subtle)]'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
                      )}
                    >
                      <span className={cn(
                        'flex h-4 w-4 items-center justify-center text-[11px]',
                        locale === t ? 'text-[var(--accent)]' : 'opacity-0'
                      )}>
                        &#10003;
                      </span>
                      <span>{localeNames[t]}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <SearchDialog isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </header>
  )
}
