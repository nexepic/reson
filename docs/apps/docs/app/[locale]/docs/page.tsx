import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, FolderKanban } from 'lucide-react'
import { generateSiteMetadata } from '@/lib/metadata'
import { getProjectGroups } from '@/lib/docs'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params

  return generateSiteMetadata({
    title: locale === 'zh' ? '文档总览' : 'Documentation Overview',
    description:
      locale === 'zh'
        ? '按项目与主题浏览全部文档内容。'
        : 'Browse all docs grouped by projects and topics.',
    pathname: `/${locale}/docs`,
    locale,
  })
}

export default async function DocsIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const projects = getProjectGroups(locale)
  const title = locale === 'zh' ? '文档总览' : 'Documentation Overview'
  const subtitle =
    locale === 'zh'
      ? '按项目和分类快速定位内容，支持 Cmd/Ctrl + K 全站搜索。'
      : 'Navigate by project and category, with Cmd/Ctrl + K global search.'
  const pageUnit = locale === 'zh' ? '篇' : 'pages'

  return (
    <section className="doc-content">
      <header className="mb-10">
        <h1>{title}</h1>
        <p className="mt-3 text-[17px] leading-relaxed text-[var(--text-secondary)]">{subtitle}</p>
      </header>

      <div className="space-y-8">
        {projects.map((project) => (
          <article key={project.key} className="rounded-xl border border-[var(--border)] p-6">
            <div className="mb-5">
              <p className="inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wider text-[var(--accent)]">
                <FolderKanban className="h-3.5 w-3.5" />
                {project.itemCount} {pageUnit}
              </p>
              <h2 className="mt-1.5 text-xl font-semibold text-[var(--text-primary)]">{project.title}</h2>
              {project.description && (
                <p className="mt-1 text-[14px] text-[var(--text-tertiary)]">{project.description}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {project.categories.map((group) => (
                <section
                  key={`${project.key}-${group.title}`}
                  className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4"
                >
                  <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">{group.title}</h3>
                  <ul className="mt-3 space-y-2">
                    {group.items.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href as any}
                          className="group inline-flex items-center gap-1.5 text-[14px] text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
                        >
                          <span>{item.title}</span>
                          <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
