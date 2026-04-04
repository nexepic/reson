import Link from "next/link";
import { ArrowRight, BookOpen, Search, Terminal } from "lucide-react";
import type { ProjectGroup } from "@/lib/docs";
import { siteConfig } from "@/lib/site";

const homeCopy = {
  en: {
    title: "Documentation",
    subtitle:
      "Everything you need to get started, integrate, and build with confidence.",
    start: "Get Started",
    viewRepo: "GitHub",
    guidesTitle: "Developer Guide",
    guidesDesc:
      "Step-by-step tutorials to help you get up and running quickly.",
    apiTitle: "API Reference",
    apiDesc: "Detailed documentation for all available interfaces and methods.",
    searchTitle: "Search",
    searchDesc:
      "Find what you need instantly with full-text search across all docs.",
    sections: "Browse by section",
  },
  zh: {
    title: "文档",
    subtitle: "快速上手、集成和构建所需的一切。",
    start: "开始使用",
    viewRepo: "GitHub",
    guidesTitle: "开发指南",
    guidesDesc: "逐步教程，帮助你快速上手。",
    apiTitle: "API 参考",
    apiDesc: "所有可用接口和方法的详细文档。",
    searchTitle: "搜索",
    searchDesc: "全文搜索，即时找到所需内容。",
    sections: "按分区浏览",
  },
} as const;

type SupportedHomeLocale = keyof typeof homeCopy;

function resolveHomeLocale(locale: string): SupportedHomeLocale {
  if (locale in homeCopy) {
    return locale as SupportedHomeLocale;
  }
  return "en";
}

export interface HomePageProps {
  locale: string;
  firstDocHref: string;
  projects: ProjectGroup[];
  jsonLd: Record<string, unknown>;
}

/**
 * Default homepage implementation.
 * This file is the primary customization point for users.
 */
export function HomePage({
  locale,
  firstDocHref,
  projects,
  jsonLd,
}: HomePageProps) {
  const copy = homeCopy[resolveHomeLocale(locale)];

  return (
    <div className="flex h-[calc(100vh-56px)] flex-col supports-[height:100dvh]:h-[calc(100dvh-56px)]">
      <main
        id="home-main"
        className="scrollbar-auto-hide min-h-0 flex-1 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]"
      >
        <div className="mx-auto w-full max-w-3xl px-6 pb-24 pt-16 sm:px-8 sm:pt-24">
          <div className="mb-16">
            <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)] sm:text-5xl">
              {copy.title}
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-[var(--text-secondary)]">
              {copy.subtitle}
            </p>
            <div className="mt-8 flex gap-3">
              <Link
                href={firstDocHref as any}
                className="inline-flex items-center gap-2 rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--bg-primary)] transition hover:bg-[var(--accent-hover)]"
              >
                {copy.start}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <a
                href={siteConfig.github}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:border-[var(--border-hover)] hover:text-[var(--text-primary)]"
              >
                {copy.viewRepo}
              </a>
            </div>
          </div>

          <div className="mb-16 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-[var(--border)] p-5 transition hover:border-[var(--border-hover)]">
              <BookOpen className="h-5 w-5 text-[var(--accent)]" />
              <h2 className="mt-3 text-sm font-semibold text-[var(--text-primary)]">
                {copy.guidesTitle}
              </h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--text-tertiary)]">
                {copy.guidesDesc}
              </p>
            </div>
            <div className="rounded-lg border border-[var(--border)] p-5 transition hover:border-[var(--border-hover)]">
              <Terminal className="h-5 w-5 text-[var(--accent)]" />
              <h2 className="mt-3 text-sm font-semibold text-[var(--text-primary)]">
                {copy.apiTitle}
              </h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--text-tertiary)]">
                {copy.apiDesc}
              </p>
            </div>
            <div className="rounded-lg border border-[var(--border)] p-5 transition hover:border-[var(--border-hover)]">
              <Search className="h-5 w-5 text-[var(--accent)]" />
              <h2 className="mt-3 text-sm font-semibold text-[var(--text-primary)]">
                {copy.searchTitle}
              </h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--text-tertiary)]">
                {copy.searchDesc}
              </p>
            </div>
          </div>

          {projects.length > 0 && (
            <div>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                {copy.sections}
              </h2>
              <div className="space-y-2">
                {projects.map((project) => {
                  const href = project.categories[0]?.items[0]?.href;
                  return (
                    <Link
                      key={project.key}
                      href={(href || `/${locale}/docs`) as any}
                      className="group flex items-center justify-between rounded-lg border border-[var(--border)] px-5 py-4 transition hover:border-[var(--border-hover)]"
                    >
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {project.title}
                        </p>
                        {project.description && (
                          <p className="mt-0.5 text-[13px] text-[var(--text-tertiary)]">
                            {project.description}
                          </p>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 text-[var(--text-tertiary)] transition group-hover:text-[var(--text-secondary)]" />
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-[var(--border)] px-6 py-5">
        <div className="mx-auto flex max-w-3xl items-center justify-between text-[13px] text-[var(--text-tertiary)]">
          <span>{siteConfig.name}</span>
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

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}

export default HomePage;
