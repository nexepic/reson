'use client'

import { useState } from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2, Info, ChevronDown, ChevronRight } from 'lucide-react'

type CalloutType = 'info' | 'warning' | 'danger' | 'success' | 'note' | 'tip'

interface CalloutProps {
  type?: CalloutType
  title?: string
  compact?: boolean
  children: React.ReactNode
}

const typeMap: Record<CalloutType, 'info' | 'warning' | 'danger' | 'success'> = {
  info: 'info',
  note: 'info',
  warning: 'warning',
  danger: 'danger',
  success: 'success',
  tip: 'success',
}

const styles = {
  info: {
    icon: Info,
    colorVar: '--callout-info',
    bgVar: '--callout-info-bg',
    borderVar: '--callout-info-border',
  },
  warning: {
    icon: AlertTriangle,
    colorVar: '--callout-warning',
    bgVar: '--callout-warning-bg',
    borderVar: '--callout-warning-border',
  },
  danger: {
    icon: AlertCircle,
    colorVar: '--callout-danger',
    bgVar: '--callout-danger-bg',
    borderVar: '--callout-danger-border',
  },
  success: {
    icon: CheckCircle2,
    colorVar: '--callout-success',
    bgVar: '--callout-success-bg',
    borderVar: '--callout-success-border',
  },
}

const defaultTitles = { info: 'Note', warning: 'Warning', danger: 'Danger', success: 'Tip' }

export function Callout({ type = 'info', title, compact: initialCompact, children }: CalloutProps) {
  const normalizedType = typeMap[type]
  const style = styles[normalizedType]
  const Icon = style.icon
  const [isCompact, setIsCompact] = useState(initialCompact ?? false)

  return (
    <aside
      className="relative my-5 overflow-hidden rounded-lg border"
      style={{
        background: `var(${style.bgVar})`,
        borderColor: `var(${style.borderVar})`,
      }}
    >
      <div className="px-4 py-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon
              className="h-[16px] w-[16px] flex-shrink-0"
              style={{ color: `var(${style.colorVar})` }}
            />
            <span className="text-[13px] font-medium" style={{ color: `var(${style.colorVar})` }}>
              {title || defaultTitles[normalizedType]}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsCompact((v) => !v)}
            className="inline-flex h-5 w-5 items-center justify-center rounded text-[var(--text-tertiary)] opacity-30 transition-opacity hover:opacity-70"
            aria-label={isCompact ? 'Expand' : 'Collapse'}
          >
            {isCompact ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        {!isCompact && (
          <div className="callout-content mt-2 text-[14px] leading-relaxed text-[var(--text-secondary)]">
            {children}
          </div>
        )}
      </div>
    </aside>
  )
}
