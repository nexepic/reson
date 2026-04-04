'use client'

import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const main = document.getElementById('docs-main')
    if (!main) return

    const handleScroll = () => {
      setVisible(main.scrollTop > 400)
    }

    handleScroll()
    main.addEventListener('scroll', handleScroll, { passive: true })
    return () => main.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <button
      type="button"
      onClick={() => {
        const main = document.getElementById('docs-main')
        if (main) {
          main.scrollTo({ top: 0, behavior: 'smooth' })
        }
      }}
      className={cn('back-to-top', visible && 'visible')}
      aria-label="Back to top"
    >
      <ArrowUp className="h-4 w-4" />
    </button>
  )
}
