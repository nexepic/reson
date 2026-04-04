import { useLocale } from 'next-intl'
import { siteConfig } from '@/lib/site'

export function Footer() {
  const locale = useLocale()
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-[var(--border)] px-6 py-5">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between text-[13px] text-[var(--text-tertiary)]">
        <span>&copy; {year} {siteConfig.name}</span>
        <a
          href={siteConfig.github}
          target="_blank"
          rel="noreferrer"
          className="transition hover:text-[var(--text-secondary)]"
        >
          GitHub
        </a>
      </div>
    </footer>
  )
}
