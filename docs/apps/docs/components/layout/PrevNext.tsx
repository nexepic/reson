'use client'

import Link from 'next/link'
import { useLocale } from 'next-intl'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getPrevNext } from '@/lib/docs'

export function PrevNext({ currentSlug }: { currentSlug: string }) {
  const locale = useLocale()
  const { prev, next } = getPrevNext(locale, currentSlug)

  if (!prev && !next) {
    return null
  }

  const prevLabel = locale === 'zh' ? '上一页' : 'Previous'
  const nextLabel = locale === 'zh' ? '下一页' : 'Next'

  return (
    <div className="mt-12 grid gap-3 border-t border-[var(--border)] pt-6 sm:grid-cols-2">
      {prev ? (
        <Link
          href={prev.href as any}
          className="group rounded-lg border border-[var(--border)] p-4 transition hover:border-[var(--border-hover)]"
        >
          <p className="inline-flex items-center gap-1 text-[12px] text-[var(--text-tertiary)]">
            <ChevronLeft className="h-3.5 w-3.5 transition group-hover:-translate-x-0.5" />
            {prevLabel}
          </p>
          <p className="mt-1.5 text-[14px] font-medium text-[var(--text-primary)]">{prev.title}</p>
        </Link>
      ) : (
        <div />
      )}

      {next ? (
        <Link
          href={next.href as any}
          className="group rounded-lg border border-[var(--border)] p-4 text-right transition hover:border-[var(--border-hover)]"
        >
          <p className="inline-flex items-center gap-1 text-[12px] text-[var(--text-tertiary)]">
            {nextLabel}
            <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
          </p>
          <p className="mt-1.5 text-[14px] font-medium text-[var(--text-primary)]">{next.title}</p>
        </Link>
      ) : (
        <div />
      )}
    </div>
  )
}
