import { redirect } from 'next/navigation'
import { getLocaleDocs } from '@/lib/docs'
import { defaultLocale } from '@/lib/i18n'

export function generateStaticParams() {
  return getLocaleDocs(defaultLocale).map((doc) => ({
    slug: doc.slug.split('/'),
  }))
}

export default async function DefaultLocaleDocPage({
  params,
}: {
  params: Promise<{ slug: string[] }>
}) {
  const { slug } = await params
  const normalizedSlug = slug.join('/')

  if (!normalizedSlug) {
    redirect(`/${defaultLocale}/docs`)
  }

  redirect(`/${defaultLocale}/docs/${normalizedSlug}`)
}
