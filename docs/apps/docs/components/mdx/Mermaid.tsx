'use client'

import { useEffect, useId, useRef, useState } from 'react'
import type { MermaidRuntimeOptions } from '@/lib/plugins/mermaid'

interface MermaidProps {
  chart?: string
  chartBase64?: string
  config?: MermaidRuntimeOptions
  configBase64?: string
}

type DomPurifyLike = {
  sanitize?: (...args: unknown[]) => unknown
  addHook?: (...args: unknown[]) => unknown
  removeHook?: (...args: unknown[]) => unknown
  removeHooks?: (...args: unknown[]) => unknown
  removeAllHooks?: (...args: unknown[]) => unknown
  setConfig?: (...args: unknown[]) => unknown
  clearConfig?: (...args: unknown[]) => unknown
}

async function patchDomPurifyForMermaid(): Promise<void> {
  try {
    const domPurifyModule = await import('dompurify')
    const candidate = domPurifyModule.default as DomPurifyLike & ((root?: Window) => DomPurifyLike)

    if (typeof candidate !== 'function' || typeof candidate.sanitize === 'function') {
      return
    }

    const instance = candidate(window)
    if (!instance || typeof instance.sanitize !== 'function') {
      return
    }

    const methodNames: Array<keyof DomPurifyLike> = [
      'sanitize',
      'addHook',
      'removeHook',
      'removeHooks',
      'removeAllHooks',
      'setConfig',
      'clearConfig',
    ]

    for (const methodName of methodNames) {
      const method = instance[methodName]
      if (typeof method === 'function' && typeof candidate[methodName] !== 'function') {
        candidate[methodName] = method.bind(instance)
      }
    }
  } catch {
    // Mermaid will surface the import/runtime error below.
  }
}

function formatMermaidError(nextError: unknown, chartText: string): string {
  const message = nextError instanceof Error ? nextError.message : 'Failed to render Mermaid diagram.'
  if (message.includes('DOMPurify.sanitize is not a function')) {
    return 'Mermaid runtime dependency error (DOMPurify). Ensure DOMPurify is installed and loaded in the docs app runtime.'
  }
  if (message.includes("reading 'replace'")) {
    if (!chartText) {
      return 'Mermaid source is empty. Ensure the ```mermaid fenced block has valid content.'
    }
    return 'Mermaid internal parse error (reading replace). This is often caused by invalid class/style directives. Validate this chart in Mermaid Live Editor and simplify classDef/style/linkStyle statements.'
  }
  return message
}

function getTheme(config: MermaidRuntimeOptions): string {
  return document.documentElement.dataset.theme === 'dark' ? config.theme.dark : config.theme.light
}

function decodeBase64Utf8(value?: string): string {
  if (!value) {
    return ''
  }

  try {
    const binary = window.atob(value)
    let escaped = ''
    for (let index = 0; index < binary.length; index += 1) {
      escaped += `%${binary.charCodeAt(index).toString(16).padStart(2, '0')}`
    }
    return decodeURIComponent(escaped)
  } catch {
    return ''
  }
}

function resolveRuntimeConfig(
  config: MermaidRuntimeOptions | undefined,
  configBase64: string | undefined
): MermaidRuntimeOptions {
  const fallback: MermaidRuntimeOptions = {
    theme: {
      light: 'default',
      dark: 'dark',
    },
    securityLevel: 'loose',
  }

  if (config) {
    return config
  }

  if (configBase64) {
    try {
      const decoded = decodeBase64Utf8(configBase64)
      if (!decoded) {
        return fallback
      }
      const parsed = JSON.parse(decoded) as MermaidRuntimeOptions
      if (parsed?.theme?.light && parsed?.theme?.dark && parsed?.securityLevel) {
        return parsed
      }
    } catch {
      // Fall through to fallback.
    }
  }

  return fallback
}

export function Mermaid({ chart, chartBase64, config, configBase64 }: MermaidProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const id = useId().replace(/:/g, '-')

  useEffect(() => {
    let active = true
    const runtimeConfig = resolveRuntimeConfig(config, configBase64)

    const render = async () => {
      if (!containerRef.current) {
        return
      }

      const chartText =
        typeof chart === 'string'
          ? chart.trim()
          : decodeBase64Utf8(chartBase64).trim()
      if (!chartText) {
        containerRef.current.innerHTML = ''
        setError(null)
        return
      }

      try {
        await patchDomPurifyForMermaid()
        const { default: mermaid } = await import('mermaid')
        mermaid.initialize({
          startOnLoad: false,
          theme: getTheme(runtimeConfig) as any,
          securityLevel: runtimeConfig.securityLevel,
        })

        await mermaid.parse(chartText)
        const graphId = `mermaid-${id}-${Date.now()}`
        const { svg } = await mermaid.render(graphId, chartText)
        if (!active || !containerRef.current) {
          return
        }

        containerRef.current.innerHTML = svg
        setError(null)
      } catch (nextError) {
        if (!active) {
          return
        }
        setError(formatMermaidError(nextError, chartText))
      }
    }

    const observer = new MutationObserver((records) => {
      if (records.some((record) => record.attributeName === 'data-theme')) {
        void render()
      }
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })

    void render()

    return () => {
      active = false
      observer.disconnect()
    }
  }, [chart, chartBase64, config, configBase64, id])

  if (error) {
    return (
      <pre className="my-6 overflow-x-auto rounded-md border border-[var(--border)] bg-[var(--bg-code)] p-4 text-sm text-[var(--text-secondary)]">
        Mermaid render error: {error}
      </pre>
    )
  }

  return <div ref={containerRef} className="my-6 overflow-x-auto" />
}
