'use client'

import { useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'
import { getDocByHref, getNavGroups } from '@/lib/docs'
import { siteConfig } from '@/lib/site'
import { cn } from '@/lib/utils'
import { useAutoHideScrollbar } from '@/components/layout/useAutoHideScrollbar'

interface SidebarProps {
  isMobileMenuOpen?: boolean
  onMobileMenuClose?: () => void
}

interface ActiveNavScope {
  prefixes: string[]
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

/**
 * Determine which nav entry owns the current page using slug prefixes.
 */
function useActiveNavScope(pathname: string): ActiveNavScope | null {
  return useMemo(() => {
    const doc = getDocByHref(pathname)
    if (!doc) return null

    for (const entry of siteConfig.nav) {
      const prefixes = (entry.matchPrefixes ?? []).map((prefix) => normalizePrefix(prefix)).filter(Boolean)
      if (prefixes.length > 0 && prefixes.some((prefix) => matchesPrefix(doc.slug, prefix))) {
        return { prefixes }
      }
    }
    return null
  }, [pathname])
}

export function Sidebar({ isMobileMenuOpen = false, onMobileMenuClose }: SidebarProps) {
  const pathname = usePathname()
  const locale = useLocale()
  const activeScope = useActiveNavScope(pathname)
  const sidebarRef = useRef<HTMLElement>(null)

  useAutoHideScrollbar(sidebarRef)

  const filteredGroups = useMemo(
    () =>
      getNavGroups(locale, {
        prefixes: activeScope?.prefixes,
      }),
    [locale, activeScope]
  )

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [isMobileMenuOpen])

  const sidebarContent = (
    <nav className="docs-nav-font space-y-6 py-8 pr-4">
      {filteredGroups.map((group, groupIndex) => {
        // Use first item's href to create a unique key for groups with same title
        const groupKey = group.items.length > 0 ? `${group.title}-${group.items[0].href}` : `${group.title}-${groupIndex}`
        return (
          <div key={groupKey}>
            <p className="docs-nav-label mb-1.5 text-[12px] uppercase tracking-wider text-[var(--text-tertiary)]">
              {group.title}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.endsWith(item.href)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href as any}
                      onClick={onMobileMenuClose}
                      style={active ? { color: 'var(--accent)' } : undefined}
                      className={cn(
                        'docs-nav-item block py-1.5 pl-3 text-[14px] leading-normal rounded-md transition-colors duration-100',
                        active
                          ? 'bg-[var(--bg-elevated)]'
                          : 'hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                      )}
                    >
                      {item.title}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </nav>
  )

  return (
    <>
      {isMobileMenuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onMobileMenuClose}
          aria-label="Close menu"
        />
      )}

      <aside
        ref={sidebarRef}
        className={cn(
          'scrollbar-auto-hide fixed left-0 top-14 z-40 h-[calc(100vh-56px)] w-[280px] shrink-0 overflow-y-auto overscroll-y-contain border-r border-[var(--border)] bg-[var(--bg-code-strong)] pl-6 transition-transform duration-200 ease-out lg:translate-x-0',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
