'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'
import { cn } from '@/lib/utils'
import { useAutoHideScrollbar } from '@/components/layout/useAutoHideScrollbar'

interface TocHeading {
  id: string
  text: string
  level: 2 | 3
}

function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[`~!@#$%^&*()+=<[\]{}|\\:;"'.,?/]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export function TableOfContents() {
  const pathname = usePathname()
  const locale = useLocale()
  const [headings, setHeadings] = useState<TocHeading[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const listRef = useRef<HTMLUListElement>(null)
  const rafRef = useRef<number>(0)
  const prevPathnameRef = useRef(pathname)
  const parseRafRef = useRef<number>(0)
  const desktopTocRef = useRef<HTMLElement>(null)

  const getMainScroller = () => document.getElementById('docs-main') as HTMLElement | null

  const title = useMemo(() => (locale === 'zh' ? '本页目录' : 'On this page'), [locale])
  const isDocDetailPage = useMemo(
    () => /\/docs\/.+/.test(pathname),
    [pathname]
  )

  useAutoHideScrollbar(desktopTocRef)

  function parseHeadingsFromDom(): TocHeading[] {
    const elements = Array.from(
      document.querySelectorAll('#doc-article h2, #doc-article h3')
    ) as HTMLHeadingElement[]

    const seen = new Map<string, number>()
    return elements.map((el, i) => {
      const level = Number(el.tagName.slice(1)) as 2 | 3
      const text = (el.textContent || '').trim()
      let id = el.id
      if (!id) {
        const base = slugify(text) || `section-${i + 1}`
        const dup = seen.get(base) || 0
        seen.set(base, dup + 1)
        id = dup === 0 ? base : `${base}-${dup}`
        el.id = id
      }
      return { id, text, level }
    })
  }

  function isSameHeadings(a: TocHeading[], b: TocHeading[]): boolean {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i += 1) {
      if (a[i].id !== b[i].id || a[i].text !== b[i].text || a[i].level !== b[i].level) {
        return false
      }
    }
    return true
  }

  // Parse headings on route change and re-parse when article DOM updates.
  useEffect(() => {
    const syncHeadings = () => {
      const parsed = parseHeadingsFromDom()
      setHeadings((prev) => (isSameHeadings(prev, parsed) ? prev : parsed))
      setActiveId((prev) => {
        if (parsed.length === 0) return ''
        if (prev && parsed.some((item) => item.id === prev)) return prev
        return parsed[0].id
      })
    }

    const scheduleSync = () => {
      cancelAnimationFrame(parseRafRef.current)
      parseRafRef.current = requestAnimationFrame(syncHeadings)
    }

    syncHeadings()
    // Ensure we catch streaming/hydration timing where headings appear slightly later.
    scheduleSync()
    setMobileOpen(false)

    const observerRoot = document.getElementById('docs-main') || document.body
    const observer = new MutationObserver(scheduleSync)
    observer.observe(observerRoot, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      cancelAnimationFrame(parseRafRef.current)
    }
  }, [pathname])

  // Scroll-based active heading detection
  useEffect(() => {
    if (headings.length === 0) return

    const ACTIVE_OFFSET = 80

    const onScroll = () => {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        const main = getMainScroller()
        if (!main) return

        const mainTop = main.getBoundingClientRect().top
        const currentScrollTop = main.scrollTop
        const threshold = currentScrollTop + ACTIVE_OFFSET
        let current = headings[0]?.id || ''

        for (const h of headings) {
          const el = document.getElementById(h.id)
          if (!el) continue
          const topInMain = el.getBoundingClientRect().top - mainTop + currentScrollTop
          if (topInMain <= threshold) {
            current = h.id
          } else {
            break
          }
        }

        setActiveId(current)
      })
    }

    onScroll()

    const main = getMainScroller()
    if (!main) return

    main.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      main.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(rafRef.current)
    }
  }, [headings])

  // Handle TOC link click
  const handleClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    const el = document.getElementById(id)
    const main = getMainScroller()
    if (el && main) {
      const top =
        el.getBoundingClientRect().top -
        main.getBoundingClientRect().top +
        main.scrollTop -
        24
      main.scrollTo({ top, behavior: 'instant' })
    }
    setActiveId(id)
    setMobileOpen(false)
  }

  // Compute indicator position after DOM commit
  const [indicatorStyle, setIndicatorStyle] = useState({ top: 0, height: 0, opacity: 0 })

  // Detect page switch: disable indicator transition when pathname changes
  const isPageSwitch = pathname !== prevPathnameRef.current

  useLayoutEffect(() => {
    prevPathnameRef.current = pathname
  }, [pathname])

  useLayoutEffect(() => {
    if (!listRef.current || !activeId) {
      setIndicatorStyle({ top: 0, height: 0, opacity: 0 })
      return
    }

    const activeLink = listRef.current.querySelector(`[data-toc-id="${activeId}"]`) as HTMLElement
    if (!activeLink) {
      setIndicatorStyle({ top: 0, height: 0, opacity: 0 })
      return
    }

    const li = activeLink.closest('li') as HTMLElement
    if (!li) {
      setIndicatorStyle({ top: 0, height: 0, opacity: 0 })
      return
    }

    setIndicatorStyle({
      top: li.offsetTop,
      height: li.offsetHeight,
      opacity: 1,
    })
  }, [activeId, headings])

  if (headings.length === 0 && !isDocDetailPage) return null

  const tocList = (
    <div className="relative">
      {/* Vertical track line */}
      <div className="absolute left-0 top-0 bottom-0 w-px bg-[var(--border)]" />
      {/* Animated cursor indicator — no transition on page switch */}
      <div
        className="absolute left-0 w-0.5 rounded-full"
        style={{
          top: indicatorStyle.top,
          height: indicatorStyle.height,
          opacity: indicatorStyle.opacity,
          background: 'var(--accent)',
          transition: isPageSwitch
            ? 'none'
            : 'top 0.25s cubic-bezier(0.25, 0.1, 0.25, 1), height 0.25s cubic-bezier(0.25, 0.1, 0.25, 1), opacity 0.15s ease',
        }}
      />
      <ul ref={listRef} className="relative space-y-0.5 pl-4">
        {headings.map((h) => {
          const isActive = activeId === h.id
          return (
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                data-toc-id={h.id}
                onClick={(e) => handleClick(e, h.id)}
                style={{ color: isActive ? 'var(--accent)' : undefined }}
                className={cn(
                  'docs-nav-item block py-1.5 text-[13px] leading-snug transition-colors duration-150',
                  h.level === 3 ? 'pl-4 text-[12.5px]' : 'pl-0.5',
                  !isActive && 'text-[color:var(--text-tertiary)] hover:text-[color:var(--text-secondary)]'
                )}
              >
                {h.text}
              </a>
            </li>
          )
        })}
      </ul>
    </div>
  )

  const tocTitleIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="block h-[14px] w-[14px] shrink-0 self-center translate-y-px"
      style={{ color: 'var(--text-tertiary)' }}
      aria-hidden="true"
    >
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="14" y1="12" y2="12" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  )

  return (
    <>
      {/* Desktop */}
      <aside
        ref={desktopTocRef}
        className="docs-nav-font scrollbar-auto-hide absolute inset-y-0 right-0 hidden h-full w-[260px] overflow-y-auto overscroll-y-contain py-10 pl-2 pr-4 min-[1400px]:right-[clamp(24px,calc((100vw-1840px)/2),999px)] min-[1400px]:block"
      >
        <p className="docs-nav-label mb-4 inline-flex items-center gap-2 text-[13px] leading-none" style={{ color: 'var(--text-primary)' }}>
          {tocTitleIcon}
          <span className="block leading-none">{title}</span>
        </p>
        {headings.length > 0 ? tocList : null}
      </aside>

      {/* Mobile */}
      {headings.length > 0 && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 min-[1400px]:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="docs-nav-font docs-nav-item flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] px-3.5 py-2 text-[13px] leading-none shadow-lg"
            style={{ color: 'var(--text-secondary)' }}
          >
            {tocTitleIcon}
            <span className="block leading-none">{title}</span>
          </button>
        </div>
      )}

      {headings.length > 0 && mobileOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-50 min-[1400px]:hidden"
            style={{ background: 'var(--overlay-scrim)' }}
            onClick={() => setMobileOpen(false)}
            aria-label="Close"
          />
          <div className="docs-nav-font scrollbar-auto-hide fixed bottom-0 left-0 right-0 z-50 max-h-[50vh] overflow-y-auto overscroll-y-contain rounded-t-xl border-t border-[var(--border)] bg-[var(--bg-secondary)] px-5 py-4 min-[1400px]:hidden">
            <p className="docs-nav-label mb-3 text-[12px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
              {title}
            </p>
            {tocList}
          </div>
        </>
      )}
    </>
  )
}
