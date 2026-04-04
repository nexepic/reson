'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { ArrowRight, CornerDownLeft, Search } from 'lucide-react'
import { searchDocs, type SearchResult } from '@/lib/search'
import { cn } from '@/lib/utils'

function highlightQuery(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'))
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="search-highlight">{part}</mark>
    ) : (
      part
    )
  )
}

interface SearchDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function SearchDialog({ isOpen, onClose }: SearchDialogProps) {
  const locale = useLocale()
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [activeIndex, setActiveIndex] = useState(-1)

  // Ensure portal target exists (client-side only)
  useEffect(() => { setMounted(true) }, [])

  const labels = useMemo(
    () => ({
      placeholder: locale === 'zh' ? '搜索文档...' : 'Search documentation...',
      noResult: locale === 'zh' ? '未找到结果' : 'No results found',
    }),
    [locale]
  )

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setResults([])
      setActiveIndex(-1)
      const t = window.setTimeout(() => inputRef.current?.focus(), 50)
      return () => window.clearTimeout(t)
    }
  }, [isOpen])

  // Search
  useEffect(() => {
    if (!isOpen) return
    if (!query.trim()) { setResults([]); setActiveIndex(-1); return }
    const r = searchDocs(query, locale)
    setResults(r)
    setActiveIndex(r.length > 0 ? 0 : -1)
  }, [isOpen, query, locale])

  // Global ESC handler
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', handler, true) // capture phase
    return () => window.removeEventListener('keydown', handler, true)
  }, [isOpen, onClose])

  // Lock body scroll when open
  useEffect(() => {
    if (!isOpen) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Keyboard handling for input
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (results.length === 0) return
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => (i + 1) % results.length)
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => (i <= 0 ? results.length - 1 : i - 1))
      }
      if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault()
        router.push(results[activeIndex].href as any)
        onClose()
      }
    },
    [activeIndex, onClose, results, router]
  )

  if (!isOpen || !mounted) return null

  const dialog = (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center px-4 pt-[15vh]"
      onClick={(e) => {
        // Click on backdrop (not on panel) closes
        if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
          onClose()
        }
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0" style={{ background: 'var(--overlay-scrim)' }} />

      {/* Panel */}
      <div
        ref={panelRef}
        className="relative z-10 w-full max-w-[560px] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] shadow-2xl"
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
          <Search className="h-[18px] w-[18px] shrink-0 text-[var(--text-tertiary)]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={labels.placeholder}
            className="h-7 w-full bg-transparent text-[15px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
          />
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded border border-[var(--border)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--text-tertiary)] transition hover:border-[var(--border-hover)] hover:text-[var(--text-secondary)]"
          >
            ESC
          </button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <ul className="scrollbar-auto-hide max-h-[50vh] overflow-y-auto p-2">
            {results.map((r, i) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => { router.push(r.href as any); onClose() }}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition',
                    i === activeIndex
                      ? 'bg-[var(--accent-subtle)] text-[var(--text-primary)]'
                      : 'text-[var(--text-secondary)]'
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium">{highlightQuery(r.title, query)}</p>
                    <p className="mt-0.5 text-[12px] text-[var(--text-tertiary)]">
                      {r.project} / {r.category}
                    </p>
                    {r.excerpt && (
                      <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-[var(--text-tertiary)]">
                        {highlightQuery(r.excerpt, query)}
                      </p>
                    )}
                  </div>
                  {i === activeIndex && (
                    <ArrowRight className="h-4 w-4 shrink-0 text-[var(--text-tertiary)]" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        {query.trim() && results.length === 0 && (
          <div className="px-4 py-8 text-center">
            <p className="text-[14px] text-[var(--text-tertiary)]">{labels.noResult}</p>
            <p className="mt-1 text-[12px] text-[var(--text-tertiary)] opacity-60">
              {locale === 'zh' ? '尝试不同的关键词' : 'Try different keywords'}
            </p>
          </div>
        )}

        {/* Footer hints */}
        <div className="flex items-center gap-4 border-t border-[var(--border)] px-4 py-2 text-[11px] text-[var(--text-tertiary)]">
          <span className="inline-flex items-center gap-1">
            <kbd className="rounded border border-[var(--border)] px-1 py-0.5 text-[10px]">↑↓</kbd>
            {locale === 'zh' ? '选择' : 'navigate'}
          </span>
          <span className="inline-flex items-center gap-1">
            <CornerDownLeft className="h-3 w-3" />
            {locale === 'zh' ? '打开' : 'open'}
          </span>
          <span className="inline-flex items-center gap-1">
            <kbd className="rounded border border-[var(--border)] px-1 py-0.5 text-[10px]">esc</kbd>
            {locale === 'zh' ? '关闭' : 'close'}
          </span>
        </div>
      </div>
    </div>
  )

  return createPortal(dialog, document.body)
}
