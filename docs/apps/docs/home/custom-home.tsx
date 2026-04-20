"use client"

import Link from 'next/link'
import type { HomePageProps } from '@/components/home/HomePage'
import { siteConfig } from '@/lib/site'

const content = {
  en: {
    system: 'AST_ANALYSIS::DUPLICATION_DETECT',
    title: 'Reson',
    subtitle: 'Structure-aware code duplication detection. Precise AST pattern matching across multi-language repositories.',
    start: 'Documentation',
    repo: 'Source',
    metrics: [
      { value: 'Multi', label: 'Language' },
      { value: 'AST', label: 'Structural' },
      { value: 'Fast', label: 'Throughput' },
    ],
    features: [
      { idx: '01', key: 'STRUCT_MATCH', desc: 'AST-level pattern analysis. Zero sensitivity to formatting, comments, or naming variance.' },
      { idx: '02', key: 'LANG_COVERAGE', desc: 'C/C++ · Java · JS/TS · Python · Go · Rust — single unified detection pipeline.' },
      { idx: '03', key: 'SCAN_ENGINE', desc: 'Parallel architecture for monorepo-scale codebases. Native CI/CD integration.' },
    ],
  },
  zh: {
    system: 'AST_ANALYSIS::DUPLICATION_DETECT',
    title: 'Reson',
    subtitle: '面向现代工程团队的 AST 代码重复检测。关注语法结构而非文本相似度，准确定位冗余逻辑。',
    start: '进入文档',
    repo: '源码',
    metrics: [
      { value: 'Multi', label: '多语言' },
      { value: 'AST', label: '结构分析' },
      { value: 'Fast', label: '高吞吐' },
    ],
    features: [
      { idx: '01', key: 'STRUCT_MATCH', desc: 'AST 级模式分析。对格式差异、注释内容、命名变化零敏感。' },
      { idx: '02', key: 'LANG_COVERAGE', desc: 'C/C++ · Java · JS/TS · Python · Go · Rust — 统一检测管线。' },
      { idx: '03', key: 'SCAN_ENGINE', desc: '并行架构适配单仓级代码库。原生 CI/CD 集成。' },
    ],
  },
} as const

export function CustomHomePage({ locale, firstDocHref, jsonLd }: HomePageProps) {
  const isEn = locale === 'en-US' || locale === 'en'
  const t = isEn ? content.en : content.zh

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap');
        @keyframes pulse-border {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .feature-row:hover .feature-indicator {
          animation: pulse-border 1.2s ease-in-out infinite;
        }
        .btn-cursor::after {
          content: '_';
          animation: blink 1s step-end infinite;
          opacity: 0;
          transition: opacity 150ms;
        }
        .btn-cursor:hover::after {
          opacity: 1;
        }
      `}</style>

      <div className="relative h-screen w-screen overflow-hidden bg-[#0b0f14] font-[JetBrains_Mono,ui-monospace,monospace] text-[#e7edf5] supports-[height:100dvh]:h-dvh">

        {/* Static background: grid + vignette */}
        <div className="pointer-events-none absolute inset-0 z-[1]" style={{ backgroundImage: 'linear-gradient(to right, rgba(148,168,190,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,168,190,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_50%_50%,transparent_20%,#0b0f14_100%)] opacity-90" />

        <main className="pointer-events-auto relative z-[2] flex h-full w-full flex-col items-center justify-center px-5 py-8 md:px-12">

          <div className="flex w-full max-w-[860px] flex-col items-center gap-0">

            {/* System identifier */}
            <div className="mb-5 inline-flex items-center gap-2.5 rounded-[3px] border border-[rgba(107,130,156,0.2)] bg-[rgba(16,22,30,0.5)] px-3 py-1.5 backdrop-blur-sm">
              <span className="relative inline-block h-[7px] w-[7px] rounded-full bg-[#94a8be]">
                <span className="absolute inset-0 animate-ping rounded-full bg-[#94a8be] opacity-40" />
              </span>
              <span className="text-[0.62rem] font-medium uppercase tracking-[0.22em] text-[#7a90aa]">{t.system}</span>
            </div>

            {/* Title */}
            <h1 className="m-0 text-center text-[3.2rem] font-bold leading-[1] tracking-[-0.03em] text-[#e7edf5] md:text-[5rem]">
              {t.title}
            </h1>

            {/* Subtitle */}
            <p className="mt-5 max-w-[560px] text-center text-[0.82rem] font-normal leading-[1.75] text-[#7a90aa] md:text-[0.9rem]">
              {t.subtitle}
            </p>

            {/* Metrics strip */}
            <div className="mt-8 flex items-stretch gap-0">
              {t.metrics.map((m, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 border-r border-[rgba(107,130,156,0.2)] px-7 last:border-r-0 md:px-10">
                  <span className="text-[1.5rem] font-bold text-[#e7edf5] md:text-[1.8rem]">{m.value}</span>
                  <span className="text-[0.58rem] uppercase tracking-[0.22em] text-[#6b829c]">{m.label}</span>
                </div>
              ))}
            </div>

            {/* Separator */}
            <div className="my-8 h-px w-full max-w-[520px] bg-gradient-to-r from-transparent via-[rgba(107,130,156,0.35)] to-transparent" />

            {/* Feature rows */}
            <div className="flex w-full max-w-[720px] flex-col gap-0 overflow-hidden rounded-[6px] border border-[rgba(107,130,156,0.15)] bg-[rgba(12,17,24,0.7)] backdrop-blur-sm">
              {t.features.map((f, i) => (
                <div
                  key={f.key}
                  className={`feature-row group relative flex items-center gap-4 px-5 py-3.5 transition-all duration-200 hover:bg-[rgba(148,168,190,0.06)] ${i < t.features.length - 1 ? 'border-b border-[rgba(107,130,156,0.1)]' : ''}`}
                >
                  <span className="feature-indicator absolute bottom-3 left-0 top-3 w-[2px] rounded-full bg-[#94a8be] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                  <span className="shrink-0 text-[0.6rem] tabular-nums text-[#4a5d72]">{f.idx}</span>
                  <span className="inline-flex shrink-0 items-center rounded-[3px] border border-[rgba(148,168,190,0.12)] bg-[rgba(148,168,190,0.07)] px-2 py-0.5 text-[0.62rem] font-bold tracking-[0.14em] text-[#94a8be]">{f.key}</span>
                  <span className="text-[0.78rem] leading-[1.55] text-[#7a90aa] transition-colors duration-200 group-hover:text-[#aec0d2]">{f.desc}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="mt-10 flex items-center gap-3">
              <Link
                href={firstDocHref as any}
                className="btn-cursor inline-flex items-center gap-2 rounded-[4px] border border-[rgba(148,168,190,0.7)] bg-[rgba(148,168,190,0.14)] px-6 py-3 text-[0.8rem] font-medium tracking-[0.04em] text-[#e7edf5] no-underline backdrop-blur-sm transition-all duration-200 hover:border-[#94a8be] hover:bg-[rgba(148,168,190,0.25)] hover:shadow-[0_0_20px_rgba(148,168,190,0.12),inset_0_1px_0_rgba(148,168,190,0.15)]"
              >
                {t.start}
              </Link>
              <a
                href={siteConfig?.github || "https://github.com"}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-[4px] border border-[rgba(107,130,156,0.25)] bg-[rgba(16,22,30,0.4)] px-6 py-3 text-[0.8rem] font-medium tracking-[0.04em] text-[#7a90aa] no-underline backdrop-blur-sm transition-all duration-200 hover:border-[rgba(107,130,156,0.5)] hover:bg-[rgba(20,28,38,0.7)] hover:text-[#aec0d2]"
              >
                {t.repo}
                <span className="text-[0.7rem]">↗</span>
              </a>
            </div>

          </div>
        </main>

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </div>
    </>
  )
}

export default CustomHomePage
