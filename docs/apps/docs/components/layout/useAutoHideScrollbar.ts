import { useEffect } from 'react'
import type { RefObject } from 'react'

const DEFAULT_IDLE_DELAY = 720

export function useAutoHideScrollbar(
  ref: RefObject<HTMLElement | null>,
  idleDelay = DEFAULT_IDLE_DELAY
) {
  useEffect(() => {
    const element = ref.current
    if (!element) return

    let timer: number | null = null

    const showScrollbarTemporarily = () => {
      element.classList.add('is-scrolling')
      if (timer !== null) {
        window.clearTimeout(timer)
      }
      timer = window.setTimeout(() => {
        element.classList.remove('is-scrolling')
      }, idleDelay)
    }

    element.addEventListener('scroll', showScrollbarTemporarily, { passive: true })
    element.addEventListener('wheel', showScrollbarTemporarily, { passive: true })
    element.addEventListener('touchmove', showScrollbarTemporarily, { passive: true })

    return () => {
      if (timer !== null) {
        window.clearTimeout(timer)
      }
      element.classList.remove('is-scrolling')
      element.removeEventListener('scroll', showScrollbarTemporarily)
      element.removeEventListener('wheel', showScrollbarTemporarily)
      element.removeEventListener('touchmove', showScrollbarTemporarily)
    }
  }, [ref, idleDelay])
}
