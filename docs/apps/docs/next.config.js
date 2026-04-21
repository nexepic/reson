const createMDX = require('@next/mdx')
const { withContentCollections } = require('@content-collections/next')
const withNextIntl = require('next-intl/plugin')('./i18n.ts')

const basePath = process.env.BASE_PATH || ''
const isStaticExport = Boolean(process.env.BASE_PATH)

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: isStaticExport ? 'export' : 'standalone',
  reactStrictMode: true,
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
  transpilePackages: ['@nexdoc/core'],
  basePath,
  assetPrefix: basePath || undefined,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
}

const withMDX = createMDX({
  extension: /\.mdx?$/,
})

module.exports = withContentCollections(withNextIntl(withMDX(nextConfig)))
