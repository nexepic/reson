export const locales = ['en', 'zh'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'en'

export const localeNames: Record<Locale, string> = {
  en: 'English',
  zh: '简体中文',
}

// Helper function to get messages
export async function getMessages(locale: string) {
  return (await import(`../messages/${locale}.json`)).default
}
