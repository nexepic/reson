import type { Metadata } from 'next'
import { locales } from '@/lib/i18n'
import { siteConfig, getSiteUrl, withSiteUrl } from '@/lib/site'

interface SiteMetadataInput {
  title?: string
  description?: string
  pathname: string
  locale?: string
  noIndex?: boolean
}

function localeAlternates(pathname: string): Record<string, string> {
  const alternates: Record<string, string> = {}
  const rawSegments = pathname.split('/').filter(Boolean)
  const localeIndex = rawSegments.findIndex((segment) =>
    locales.includes(segment as (typeof locales)[number])
  )

  for (const locale of locales) {
    const localizedSegments =
      localeIndex === -1
        ? [locale, ...rawSegments]
        : [
            ...rawSegments.slice(0, localeIndex),
            locale,
            ...rawSegments.slice(localeIndex + 1),
          ]
    const normalized = `/${localizedSegments.join('/')}`.replace(/\/+$/, '') || '/'

    alternates[locale] = withSiteUrl(normalized)
  }

  return alternates
}

function toAbsoluteAssetUrl(assetPath: string): string {
  if (/^https?:\/\//.test(assetPath)) {
    return assetPath
  }
  return withSiteUrl(assetPath.startsWith('/') ? assetPath : `/${assetPath}`)
}

function inferIconMimeType(iconPath: string): string | undefined {
  const normalizedPath = iconPath.split('#')[0].split('?')[0].toLowerCase()
  if (normalizedPath.endsWith('.svg')) return 'image/svg+xml'
  if (normalizedPath.endsWith('.png')) return 'image/png'
  if (normalizedPath.endsWith('.ico')) return 'image/x-icon'
  if (normalizedPath.endsWith('.webp')) return 'image/webp'
  if (normalizedPath.endsWith('.jpg') || normalizedPath.endsWith('.jpeg')) return 'image/jpeg'
  return undefined
}

function buildIconDescriptor(iconPath: string, media?: string) {
  const mimeType = inferIconMimeType(iconPath)
  return {
    url: toAbsoluteAssetUrl(iconPath),
    ...(media ? { media } : {}),
    ...(mimeType ? { type: mimeType } : {}),
    ...(mimeType === 'image/svg+xml' ? { sizes: 'any' } : {}),
  }
}

function dedupeIconDescriptors(
  icons: Array<ReturnType<typeof buildIconDescriptor>>
): Array<ReturnType<typeof buildIconDescriptor>> {
  const seen = new Set<string>()
  const deduped: Array<ReturnType<typeof buildIconDescriptor>> = []

  for (const icon of icons) {
    const key = `${icon.url}|${icon.media || ''}`
    if (seen.has(key)) {
      continue
    }
    seen.add(key)
    deduped.push(icon)
  }

  return deduped
}

export function generateSiteMetadata({
  title,
  description,
  pathname,
  locale,
  noIndex = false,
}: SiteMetadataInput): Metadata {
  const fullTitle = title ? `${title} | ${siteConfig.name}` : siteConfig.title
  const fullDescription = description || siteConfig.description
  const canonicalUrl = withSiteUrl(pathname)
  const favicon =
    siteConfig.assets?.icons?.favicon
    || siteConfig.assets?.icons?.icon
    || siteConfig.brand?.favicon
    || '/favicon.ico'
  const icon = siteConfig.assets?.icons?.icon || favicon
  const shortcut = siteConfig.assets?.icons?.shortcut || favicon
  const apple = siteConfig.assets?.icons?.apple || favicon
  const hasExplicitIcons =
    Boolean(siteConfig.assets?.icons?.icon)
    || Boolean(siteConfig.assets?.icons?.favicon)
    || Boolean(siteConfig.assets?.icons?.shortcut)
    || Boolean(siteConfig.assets?.icons?.apple)
  const brandLightIcon = hasExplicitIcons
    ? undefined
    : (siteConfig.assets?.brand?.iconLight || siteConfig.brand?.iconLight)
  const brandDarkIcon = hasExplicitIcons
    ? undefined
    : (siteConfig.assets?.brand?.iconDark || siteConfig.brand?.iconDark)
  const iconLinks = dedupeIconDescriptors([
    ...(brandLightIcon
      ? [buildIconDescriptor(brandLightIcon, '(prefers-color-scheme: light)')]
      : []),
    ...(brandDarkIcon
      ? [buildIconDescriptor(brandDarkIcon, '(prefers-color-scheme: dark)')]
      : []),
    buildIconDescriptor(icon),
    ...(icon !== favicon ? [buildIconDescriptor(favicon)] : []),
  ])
  const ogImage = siteConfig.assets?.social?.ogImage
  const twitterImage = siteConfig.assets?.social?.twitterImage || ogImage

  return {
    metadataBase: new URL(getSiteUrl()),
    applicationName: siteConfig.name,
    title: fullTitle,
    description: fullDescription,
    keywords: siteConfig.keywords,
    category: 'technology',
    alternates: {
      canonical: canonicalUrl,
      languages: localeAlternates(pathname),
    },
    icons: {
      icon: iconLinks,
      shortcut: [buildIconDescriptor(shortcut)],
      apple: [buildIconDescriptor(apple)],
    },
    manifest: siteConfig.assets?.manifest,
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    openGraph: {
      type: 'website',
      locale,
      siteName: siteConfig.name,
      title: fullTitle,
      description: fullDescription,
      url: canonicalUrl,
      images: ogImage ? [toAbsoluteAssetUrl(ogImage)] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: fullDescription,
      images: twitterImage ? [toAbsoluteAssetUrl(twitterImage)] : undefined,
    },
  }
}

export function buildHomeJsonLd(locale: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    description: siteConfig.description,
    inLanguage: locale,
    url: withSiteUrl(`/${locale}`),
    potentialAction: {
      '@type': 'SearchAction',
      target: `${withSiteUrl(`/${locale}`)}?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
}

export function buildDocJsonLd(params: {
  locale: string
  title: string
  description?: string
  pathname: string
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: params.title,
    description: params.description || siteConfig.description,
    inLanguage: params.locale,
    mainEntityOfPage: withSiteUrl(params.pathname),
    url: withSiteUrl(params.pathname),
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      url: getSiteUrl(),
    },
  }
}
