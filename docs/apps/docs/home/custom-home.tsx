"use client"

import Link from 'next/link'
import { useEffect, useMemo, useRef } from 'react'
import { Network, ShieldCheck, Zap } from 'lucide-react'
import type { HomePageProps } from '@/components/home/HomePage'
import { siteConfig } from '@/lib/site'

const content = {
  en: {
    badge: 'Code Duplication Detection',
    title: 'Reson',
    subtitle:
      'A fast, structure-aware code duplication detection system. Uncovering redundant logic through precise AST pattern matching.',
    start: 'Enter Docs',
    repo: 'GitHub',
    cards: [
      {
        title: 'Structure-Level Precision',
        desc: 'AST structure matching suppresses text-level noise and false positives.',
        icon: ShieldCheck,
      },
      {
        title: 'Cross-Language',
        desc: 'One unified workflow for C/C++, Java, JS/TS, Python, Go, and Rust.',
        icon: Network,
      },
      {
        title: 'High Throughput',
        desc: 'Parallel scanning engineered for large-scale repositories and CI refactoring pipelines.',
        icon: Zap,
      },
    ],
  },
  zh: {
    badge: '结构化重复检测',
    title: 'Reson',
    subtitle: '面向现代工程团队的 AST 代码重复检测工具。它关注语法结构而非文本相似度，让冗余逻辑更容易被准确定位。',
    start: '进入文档',
    repo: 'GitHub',
    cards: [
      {
        title: '结构级精度',
        desc: '基于 AST 的结构匹配有效降低注释、格式差异带来的噪声，减少误报，结果更可用。',
        icon: ShieldCheck,
      },
      {
        title: '多语言一致体验',
        desc: '一套工作流覆盖 C/C++、Java、JS/TS、Python、Go、Rust，跨仓库治理更顺手。',
        icon: Network,
      },
      {
        title: '面向大仓库性能',
        desc: '并行扫描设计可稳定处理大型代码库，适合日常 CI 检查与重构前评估。',
        icon: Zap,
      },
    ],
  },
} as const

function DataFlowCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    let width = 0
    let height = 0
    let dpr = 1

    interface Node {
      x: number
      y: number
      vx: number
      vy: number
      radius: number
      baseAlpha: number
    }

    interface Edge {
      source: Node
      target: Node
      activePhase: number
    }

    interface Packet {
      edge: Edge
      dir: number
      progress: number
      speed: number
      length: number
    }

    const nodes: Node[] = []
    const edges: Edge[] = []
    const packets: Packet[] = []

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      initGraph()
    }

    const initGraph = () => {
      nodes.length = 0
      edges.length = 0
      packets.length = 0

      const isMobile = width < 768
      const nodeCount = isMobile ? 60 : 150

      for (let i = 0; i < nodeCount; i++) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          radius: Math.random() * 1.5 + 0.5,
          baseAlpha: Math.random() * 0.5 + 0.1
        })
      }

      for (let i = 0; i < nodeCount; i++) {
        const dists = []
        for (let j = i + 1; j < nodeCount; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          dists.push({ j, d: dx * dx + dy * dy })
        }
        dists.sort((a, b) => a.d - b.d)
        const connects = Math.floor(Math.random() * 2) + 2
        for (let k = 0; k < connects && k < dists.length; k++) {
          if (dists[k].d < 40000) {
            edges.push({ source: nodes[i], target: nodes[dists[k].j], activePhase: Math.random() * Math.PI * 2 })
          }
        }
      }
    }

    let animationId: number
    let frame = 0

    const render = () => {
      frame++
      
      ctx.fillStyle = 'rgba(11, 15, 20, 0.3)'
      ctx.fillRect(0, 0, width, height)

      const scanY = (frame * 2.5) % height
      const scanGrad = ctx.createLinearGradient(0, scanY - 40, 0, scanY)
      scanGrad.addColorStop(0, 'rgba(148, 168, 190, 0)')
      scanGrad.addColorStop(0.9, 'rgba(148, 168, 190, 0.08)')
      scanGrad.addColorStop(1, 'rgba(231, 237, 245, 0.4)')
      ctx.fillStyle = scanGrad
      ctx.fillRect(0, scanY - 40, width, 40)

      nodes.forEach((n) => {
        n.x += n.vx
        n.y += n.vy
        if (n.x < 0 || n.x > width) n.vx *= -1
        if (n.y < 0 || n.y > height) n.vy *= -1
      })

      const maxDist = width < 768 ? 120 : 180

      ctx.lineWidth = 1
      edges.forEach((e) => {
        const dx = e.source.x - e.target.x
        const dy = e.source.y - e.target.y
        const dist = Math.hypot(dx, dy)

        if (dist < maxDist) {
          const alpha = (1 - dist / maxDist) * 0.3
          const pulse = (Math.sin(frame * 0.03 + e.activePhase) + 1) * 0.5
          ctx.strokeStyle = `rgba(107, 130, 156, ${alpha * (0.3 + pulse * 0.7)})`
          ctx.beginPath()
          ctx.moveTo(e.source.x, e.source.y)
          ctx.lineTo(e.target.x, e.target.y)
          ctx.stroke()

          if (Math.random() < 0.003) {
            packets.push({
              edge: e,
              dir: Math.random() > 0.5 ? 1 : -1,
              progress: 0,
              speed: 0.01 + Math.random() * 0.015,
              length: 0.1 + Math.random() * 0.2
            })
          }
        }
      })

      for (let i = packets.length - 1; i >= 0; i--) {
        const p = packets[i]
        p.progress += p.speed
        if (p.progress >= 1 + p.length) {
          packets.splice(i, 1)
          continue
        }

        const sourceNode = p.dir === 1 ? p.edge.source : p.edge.target
        const targetNode = p.dir === 1 ? p.edge.target : p.edge.source
        const sx = sourceNode.x
        const sy = sourceNode.y
        const tx = targetNode.x
        const ty = targetNode.y

        const dx = tx - sx
        const dy = ty - sy
        
        if (Math.hypot(dx, dy) > maxDist * 1.2) {
          packets.splice(i, 1)
          continue
        }

        const headProg = Math.min(1, p.progress)
        const tailProg = Math.max(0, p.progress - p.length)

        const hx = sx + dx * headProg
        const hy = sy + dy * headProg
        const tlx = sx + dx * tailProg
        const tly = sy + dy * tailProg

        const grad = ctx.createLinearGradient(tlx, tly, hx, hy)
        grad.addColorStop(0, 'rgba(148, 168, 190, 0)')
        grad.addColorStop(1, 'rgba(231, 237, 245, 0.9)')

        ctx.beginPath()
        ctx.moveTo(tlx, tly)
        ctx.lineTo(hx, hy)
        ctx.strokeStyle = grad
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.stroke()

        if (headProg < 1) {
          ctx.beginPath()
          ctx.arc(hx, hy, 2, 0, Math.PI * 2)
          ctx.fillStyle = '#ffffff'
          ctx.shadowBlur = 10
          ctx.shadowColor = '#e7edf5'
          ctx.fill()
          ctx.shadowBlur = 0 
        }
      }

      nodes.forEach((n) => {
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(148, 168, 190, ${n.baseAlpha})`
        ctx.fill()
      })

      animationId = requestAnimationFrame(render)
    }

    window.addEventListener('resize', resize)
    resize()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-0 mix-blend-screen" />
}

export function CustomHomePage({ locale, firstDocHref, jsonLd }: HomePageProps) {
  const isEn = locale === 'en-US' || locale === 'en'
  const t = isEn ? content.en : content.zh

  return (
    <>
      <style jsx global>{`
        @keyframes move-grid {
          0% { background-position: 0 0; }
          100% { background-position: 40px 40px; }
        }
        .cyber-grid-overlay {
          background-image: 
            linear-gradient(to right, rgba(148, 168, 190, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(148, 168, 190, 0.05) 1px, transparent 1px);
          background-size: 40px 40px;
          animation: move-grid 3s linear infinite;
        }
      `}</style>

      <div className="relative h-screen w-screen overflow-hidden bg-[#0b0f14] font-['Avenir_Next','Segoe_UI',system-ui,sans-serif] text-[#e7edf5] supports-[height:100dvh]:h-dvh">
        
        {/* Background Network Animation */}
        <DataFlowCanvas />

        {/* Global Overlays: Grid + Vignette */}
        <div className="pointer-events-none absolute inset-0 z-[1] cyber-grid-overlay" />
        <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_50%_50%,transparent_20%,#0b0f14_100%)] opacity-90" />

        <main className="pointer-events-auto relative z-[2] flex h-full w-full flex-col items-center justify-center p-6 md:p-12">
          
          <div className="flex w-full max-w-[1100px] flex-col items-center justify-center">
            
            <div className="mb-[1.2rem] inline-flex rounded-[50px] border border-[rgba(122,144,170,0.3)] bg-[rgba(22,30,39,0.4)] px-4 py-[0.48rem] text-[0.72rem] font-bold uppercase tracking-[0.2em] text-[#aec0d2] backdrop-blur-[4px] relative overflow-hidden">
              <span className="absolute inset-0 bg-gradient-to-b from-[rgba(148,168,190,0.1)] to-transparent" />
              {t.badge}
            </div>

            <h1 className="m-0 text-center text-[2.6rem] font-bold leading-[1.15] tracking-[0.02em] text-[#e7edf5] md:text-[clamp(3.2rem,4vw,4.5rem)]">
              {t.title}
            </h1>

            <p className="mt-[1.2rem] max-w-[680px] text-center text-[1rem] leading-[1.65] text-[#8a9bb0] md:text-[1.1rem]">
              {t.subtitle}
            </p>

            {/* Matrix Cards closely integrated under the hero content */}
            <div className="mt-12 mb-12 flex w-full flex-col gap-4 sm:grid sm:grid-cols-3 sm:gap-5 md:gap-6">
              {t.cards.map((card) => {
                const Icon = card.icon
                return (
                  <div
                    key={card.title}
                    className="relative flex flex-col overflow-hidden rounded-[12px] border border-[rgba(122,144,170,0.26)] bg-gradient-to-b from-[rgba(26,35,46,0.76)] to-[rgba(13,18,24,0.88)] p-5 backdrop-blur-xl md:p-6"
                  >
                    <div className="absolute left-0 right-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[rgba(148,168,190,0.35)] to-transparent" />
                    <div className="absolute bottom-8 left-0 top-8 w-[3px] bg-gradient-to-b from-transparent via-[rgba(107,130,156,0.25)] to-transparent" />

                    <div className="mb-4 flex items-center gap-3 relative z-10">
                      <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[8px] border border-[rgba(122,144,170,0.28)] bg-[rgba(122,144,170,0.12)] text-[#b8c7d6]">
                        <Icon className="h-[18px] w-[18px]" />
                      </div>
                      <h3 className="m-0 text-[1.05rem] font-semibold tracking-[0.02em] text-[#e7edf5]">
                        {card.title}
                      </h3>
                    </div>
                    <p className="m-0 text-[0.9rem] leading-[1.7] text-[#9fb0c4] relative z-10">
                      {card.desc}
                    </p>
                  </div>
                )
              })}
            </div>

            <div className="flex w-full flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href={firstDocHref as any}
                className="inline-flex w-full min-w-[180px] flex-1 sm:max-w-[200px] items-center justify-center gap-2 rounded-[8px] border border-[rgba(122,144,170,0.7)] bg-[rgba(35,48,63,0.6)] px-4 py-4 text-[1rem] font-medium text-[#e7edf5] no-underline backdrop-blur-[4px] transition-all duration-[250ms] hover:bg-[#778ea7] hover:text-[#0b0f14]"
              >
                {t.start}
                <span aria-hidden="true">&rarr;</span>
              </Link>

              <a
                href={siteConfig?.github || "https://github.com"}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full min-w-[180px] flex-1 sm:max-w-[200px] items-center justify-center gap-2 rounded-[8px] border border-[rgba(122,144,170,0.3)] bg-[rgba(24,34,44,0.4)] px-4 py-4 text-[1rem] font-medium text-[#b8c7d6] no-underline backdrop-blur-[4px] transition-all duration-[250ms] hover:border-[rgba(122,144,170,0.6)] hover:bg-[rgba(26,35,46,0.9)] hover:text-[#e7edf5]"
              >
                {t.repo} ↗
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
