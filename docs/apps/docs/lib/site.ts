import userConfig from '@/nexdoc.config'
import type { NavEntry, NexDocResolvedConfig, NexDocUserConfig } from '@/lib/config'
import { resolveMermaidConfig } from '@/lib/plugins/mermaid'

export type { NavEntry }

const rawConfig = userConfig as NexDocUserConfig

export const siteConfig: NexDocResolvedConfig = {
  ...rawConfig,
  mermaid: resolveMermaidConfig(rawConfig.mermaid),
}

export function getBasePath(): string {
  return process.env.NEXT_PUBLIC_BASE_PATH || ''
}

export function withBasePath(path: string): string {
  const bp = getBasePath()
  if (!bp || !path || /^https?:\/\//.test(path)) return path
  return `${bp}${path.startsWith('/') ? path : `/${path}`}`
}

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL

  if (raw) {
    try {
      const url = new URL(raw)
      if (url.pathname && url.pathname !== '/') {
        return raw.replace(/\/$/, '')
      }
      return url.origin
    } catch {
      // fall through
    }
  }

  const bp = getBasePath()
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${bp}`
  }
  return `http://localhost:3000${bp}`
}

export function withSiteUrl(pathname: string): string {
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`
  return `${getSiteUrl()}${normalizedPath}`
}
