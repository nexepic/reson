import userConfig from '@/nexdoc.config'
import type { NavEntry, NexDocResolvedConfig, NexDocUserConfig } from '@/lib/config'
import { resolveMermaidConfig } from '@/lib/plugins/mermaid'

export type { NavEntry }

const rawConfig = userConfig as NexDocUserConfig

export const siteConfig: NexDocResolvedConfig = {
  ...rawConfig,
  mermaid: resolveMermaidConfig(rawConfig.mermaid),
}

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || 'https://nexdoc.dev'

  try {
    const url = new URL(raw)
    if (url.pathname && url.pathname !== '/') {
      return raw.replace(/\/$/, '')
    }
    return url.origin
  } catch {
    return 'https://nexdoc.dev'
  }
}

export function withSiteUrl(pathname: string): string {
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`
  return `${getSiteUrl()}${normalizedPath}`
}

