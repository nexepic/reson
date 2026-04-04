'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { TableOfContents } from '@/components/layout/TableOfContents'
import { BackToTop } from '@/components/layout/BackToTop'
import { useAutoHideScrollbar } from '@/components/layout/useAutoHideScrollbar'

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const prevPathnameRef = useRef(pathname)
  const mainRef = useRef<HTMLElement>(null)

  useAutoHideScrollbar(mainRef)

  useEffect(() => {
    if (prevPathnameRef.current === pathname) return
    prevPathnameRef.current = pathname

    const main = mainRef.current
    if (main) {
      main.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [pathname])

  return (
    <div className="h-screen overflow-hidden supports-[height:100dvh]:h-dvh">
      <Header
        showSidebarToggle
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileMenuToggle={() => setIsMobileMenuOpen((v) => !v)}
      />

      <div className="flex h-[calc(100vh-56px)] w-full lg:pl-[280px] supports-[height:100dvh]:h-[calc(100dvh-56px)]">
        {/* Sidebar: flush to left edge */}
        <Sidebar
          isMobileMenuOpen={isMobileMenuOpen}
          onMobileMenuClose={() => setIsMobileMenuOpen(false)}
        />

        <div className="relative flex flex-1 min-w-0">
          {/* Content area: owns vertical scroll so elastic effect is scoped to docs body */}
          <main
            id="docs-main"
            ref={mainRef}
            className="scrollbar-auto-hide min-w-0 flex-1 overflow-y-auto overscroll-y-contain px-6 pb-20 pt-10 [-webkit-overflow-scrolling:touch] sm:px-10 lg:px-12 xl:px-8"
          >
            <div className="mx-auto w-full max-w-[1560px] min-[1400px]:pr-[280px]">
              <div className="mx-auto max-w-[880px]">
                {children}
              </div>
            </div>
          </main>

          <TableOfContents />
        </div>
      </div>

      <BackToTop />
    </div>
  )
}
