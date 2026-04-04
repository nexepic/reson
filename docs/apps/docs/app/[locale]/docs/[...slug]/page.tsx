import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import rehypePrettyCode from 'rehype-pretty-code'
import { ExternalLink } from 'lucide-react'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { PrevNext } from '@/components/layout/PrevNext'
import { useMDXComponents } from '@/mdx-components'
import { buildDocJsonLd, generateSiteMetadata } from '@/lib/metadata'
import { buildEditUrl, getAllDocs, getDocBySlug } from '@/lib/docs'
import {
  rewriteIndexRelativeDocLinks,
  stripLeadingH1,
  transformAdmonitions,
  transformMermaidFences,
} from '@/lib/mdx'
import { siteConfig } from '@/lib/site'

const mdxComponents = useMDXComponents({})

const mdxOptions = {
  mdxOptions: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeSlug,
      [
        rehypePrettyCode,
        {
          theme: {
            light: 'github-light',
            dark: 'github-dark-dimmed',
          },
          keepBackground: false,
          // Only default fenced code blocks to plaintext.
          // Do not force inline code through pretty-code transforms.
          defaultLang: {
            block: 'plaintext',
          },
        },
      ],
    ] as any,
  },
}

export async function generateStaticParams() {
  return getAllDocs().map((doc) => ({
    locale: doc.locale,
    slug: doc.slug.split('/'),
  }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string[] }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const doc = getDocBySlug(locale, slug)

  if (!doc) {
    return generateSiteMetadata({
      title: 'Not Found',
      pathname: `/${locale}/docs`,
      locale,
      noIndex: true,
    })
  }

  return generateSiteMetadata({
    title: doc.title,
    description: doc.description,
    pathname: doc.href,
    locale: doc.locale,
  })
}

export default async function DocPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string[] }>
}) {
  const { locale, slug } = await params
  const doc = getDocBySlug(locale, slug)

  if (!doc) {
    notFound()
  }

  const contentWithoutTitle = stripLeadingH1(doc.content)
  const contentWithAdmonitions = transformAdmonitions(contentWithoutTitle)
  const isIndexDoc = /[\\/]index\.mdx$/i.test(doc.filePath)
  const contentWithResolvedIndexLinks = rewriteIndexRelativeDocLinks(contentWithAdmonitions, {
    locale: doc.locale,
    docSlug: doc.slug,
    isIndexDoc,
  })
  const transformedContent = siteConfig.mermaid.enabled
    ? transformMermaidFences(contentWithResolvedIndexLinks, {
        theme: siteConfig.mermaid.theme,
        securityLevel: siteConfig.mermaid.securityLevel,
      })
    : contentWithResolvedIndexLinks
  const readLabel = doc.locale === 'zh' ? '分钟阅读' : 'min read'
  const editLabel = doc.locale === 'zh' ? '编辑此页' : 'Edit this page'
  const jsonLd = buildDocJsonLd({
    locale: doc.locale,
    title: doc.title,
    description: doc.description,
    pathname: doc.href,
  })

  return (
    <>
      <Breadcrumbs />

      <article id="doc-article" className="doc-content">
        <header className="mb-10 pb-6">
          <h1>{doc.title}</h1>
          {doc.description && (
            <p className="mt-3 text-[17px] leading-relaxed text-[var(--text-secondary)]">{doc.description}</p>
          )}
          <div className="mt-4 flex items-center gap-4 text-[13px] text-[var(--text-tertiary)]">
            <span>{doc.readingMinutes} {readLabel}</span>
            <span className="text-[var(--border-hover)]">/</span>
            <span>{doc.category}</span>
            {siteConfig.docsEditEnabled && (
              <a
                href={buildEditUrl(doc)}
                target="_blank"
                rel="noreferrer"
                className="ml-auto inline-flex items-center gap-1 transition hover:text-[var(--text-primary)]"
              >
                {editLabel}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </header>

        <div>
          <MDXRemote source={transformedContent} components={mdxComponents} options={mdxOptions} />
        </div>
      </article>

      <PrevNext currentSlug={doc.slug} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  )
}
