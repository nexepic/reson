import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import './globals.css'
import './custom.css'
import { generateSiteMetadata } from '@/lib/metadata'

export const metadata: Metadata = generateSiteMetadata({
  title: 'Reson Documentation',
  description: 'AST-based code duplication detection documentation for Reson.',
  pathname: '/',
})

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f7fb' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0f14' },
  ],
  width: 'device-width',
  initialScale: 1,
}

const themeBootstrapScript = `
(() => {
  try {
    const key = 'nexdoc-theme'
    const stored = window.localStorage.getItem(key)
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const theme = stored === 'light' || stored === 'dark'
      ? stored
      : (systemDark ? 'dark' : 'light')
    document.documentElement.dataset.theme = theme
  } catch {}
})()
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="nexdoc-theme-bootstrap" strategy="beforeInteractive">
          {themeBootstrapScript}
        </Script>
      </head>
      <body className="app-shell" suppressHydrationWarning>{children}</body>
    </html>
  )
}
