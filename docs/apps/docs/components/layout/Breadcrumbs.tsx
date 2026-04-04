'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'
import { ChevronRight, House } from 'lucide-react'
import { getDocBySlug, getProjectGroups } from '@/lib/docs'

export function Breadcrumbs() {
  const pathname = usePathname()
  const locale = useLocale()

  const localeSegment = `/${locale}/docs/`
  const localeIndex = pathname.indexOf(localeSegment)
  if (localeIndex === -1) {
    return null
  }

  const slug = pathname.slice(localeIndex + localeSegment.length)
  const slugSegments = slug.split('/').filter(Boolean)
  const doc = getDocBySlug(locale, slugSegments)

  if (!doc) {
    return null
  }

  const projects = getProjectGroups(locale)
  const project = projects.find((item) => item.key === doc.project)
  const group = project?.categories.find((item) => item.items.some((page) => page.slug === doc.slug))

  const homeLabel = locale === 'zh' ? '首页' : 'Home'
  const docsLabel = locale === 'zh' ? '文档' : 'Docs'

  return (
    <nav className="mb-8 flex flex-wrap items-center gap-2 text-[14px] font-medium text-[var(--text-tertiary)]" aria-label="Breadcrumb">
      <Link
        href={`/${locale}` as any}
        className="inline-flex items-center rounded-md transition hover:text-[var(--text-primary)]"
        aria-label={homeLabel}
      >
        <House className="h-4 w-4" />
      </Link>

      <ChevronRight className="h-4 w-4 opacity-50" />

      <Link
        href={`/${locale}/docs` as any}
        className="transition hover:text-[var(--text-primary)]"
      >
        {docsLabel}
      </Link>

      {group && (
        <>
          <ChevronRight className="h-4 w-4 opacity-50" />
          <span>{group.title}</span>
        </>
      )}

      <ChevronRight className="h-4 w-4 opacity-50" />
      <span className="text-[var(--text-secondary)]">{doc.title}</span>
    </nav>
  )
}
