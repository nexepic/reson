import { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/site'

export const dynamic = 'force-static'

export default function manifest(): MetadataRoute.Manifest {
  const basePath = process.env.BASE_PATH || ''

  return {
    name: siteConfig.name,
    short_name: 'Reson Docs',
    description: siteConfig.description,
    start_url: basePath || '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0f172a',
    icons: [
      {
        src: `${basePath}/assets/icons/favicon.svg`,
        sizes: '64x64',
        type: 'image/svg+xml'
      }
    ]
  }
}
