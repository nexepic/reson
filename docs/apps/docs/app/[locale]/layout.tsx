import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import { generateSiteMetadata } from '@/lib/metadata'
import { defaultLocale, locales } from '@/lib/i18n'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const normalizedLocale = locales.includes(locale as (typeof locales)[number])
    ? locale
    : defaultLocale

  const localizedTitle = normalizedLocale === 'zh' ? 'Reson 文档' : 'Reson Documentation'
  const localizedDescription =
    normalizedLocale === 'zh'
      ? 'Reson 的 AST 代码重复检测文档与使用指南。'
      : 'Documentation and guides for Reson AST-based code duplication detection.'

  return generateSiteMetadata({
    title: localizedTitle,
    description: localizedDescription,
    pathname: `/${normalizedLocale}`,
    locale: normalizedLocale,
  })
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!locales.includes(locale as (typeof locales)[number])) {
    notFound()
  }

  setRequestLocale(locale)

  const messages = (await import(`../../messages/${locale}.json`)).default

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      {children}
    </NextIntlClientProvider>
  )
}
