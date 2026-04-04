import type { MetadataRoute } from 'next'
import { locales } from '@/lib/i18n'
import { getAllDocs } from '@/lib/docs'
import { withSiteUrl } from '@/lib/site'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const localeEntries = locales.map((locale) => ({
    url: withSiteUrl(`/${locale}`),
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 1,
  }))

  const docsRootEntries = locales.map((locale) => ({
    url: withSiteUrl(`/${locale}/docs`),
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }))

  const docEntries = getAllDocs().map((doc) => ({
    url: withSiteUrl(doc.href),
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.78,
  }))

  return [...localeEntries, ...docsRootEntries, ...docEntries]
}
