import { defineNexDocConfig } from '@/lib/config'
import { withMermaid } from '@/lib/plugins/mermaid'

const baseSiteConfig = defineNexDocConfig({
  name: 'Reson',
  title: 'Reson Documentation',
  description:
    'Reson is a high-performance code duplication detector powered by Abstract Syntax Tree analysis.',
  keywords: [
    'reson',
    'AST analysis',
    'code duplication detection',
    'code clone detection',
    'static code analysis',
  ],
  defaultLocale: 'en',
  github: process.env.NEXT_PUBLIC_GITHUB_URL || 'https://github.com/nexepic/reson',
  docsEditEnabled: process.env.NEXT_PUBLIC_DOCS_EDIT_ENABLED === 'true',
  docsEditBase:
    process.env.NEXT_PUBLIC_DOCS_EDIT_BASE ||
    'https://github.com/nexepic/reson/edit/main/docs/apps/docs/content/docs',
  home: {
    metadata: {
      en: {
        title: 'Reson Documentation',
        description: 'AST-based code duplication detection for multi-language repositories.',
      },
      zh: {
        title: 'Reson 文档',
        description: '面向多语言仓库的 AST 代码重复检测文档。',
      },
      default: {
        title: 'Reson Documentation',
        description: 'AST-based code duplication detection.',
      },
    },
  },
  assets: {
    brand: {
      icon: '/assets/brand/icon.svg',
      iconLight: '/assets/brand/icon.svg',
      iconDark: '/assets/brand/icon-light.svg',
      alt: 'Reson',
    },
    icons: {
      favicon: '/assets/icons/favicon.svg',
    },
    social: {
      ogImage: '/assets/social/og-default.svg',
      twitterImage: '/assets/social/og-default.svg',
    },
  },
  nav: [
    {
      label: 'Getting Started',
      labelZh: '快速开始',
      href: '/docs/reson/introduction',
      matchPrefixes: ['reson/introduction', 'reson/quick-start'],
    },
    {
      label: 'Examples',
      labelZh: '使用示例',
      href: '/docs/reson/examples',
      matchPrefixes: ['reson/examples'],
    },
    {
      label: 'Deep Dive',
      labelZh: '深入解析',
      href: '/docs/reson/ast-based-analysis',
      matchPrefixes: ['reson/ast-based-analysis'],
    },
  ],
})

const config = withMermaid(baseSiteConfig, {
  enabled: false,
})

export default config
