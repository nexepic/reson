import { redirect } from 'next/navigation'
import { defaultLocale } from '@/lib/i18n'

export default function DefaultLocaleDocsIndexPage() {
  redirect(`/${defaultLocale}/docs`)
}
