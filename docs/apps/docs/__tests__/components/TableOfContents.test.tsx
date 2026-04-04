import { act, fireEvent, render, screen } from '@testing-library/react'
import { TableOfContents } from '@/components/layout/TableOfContents'

let mockPathname = '/en/docs/getting-started/introduction'

jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}))

jest.mock('next-intl', () => ({
  useLocale: () => 'en',
}))

class MockMutationObserver {
  observe() {}
  disconnect() {}
}

Object.defineProperty(window, 'MutationObserver', {
  writable: true,
  value: MockMutationObserver,
})

beforeEach(() => {
  jest.useFakeTimers()
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
    return window.setTimeout(() => cb(performance.now()), 0)
  })
  jest.spyOn(window, 'cancelAnimationFrame').mockImplementation((id: number) => {
    clearTimeout(id)
  })

  document.body.innerHTML = `
    <main id="docs-main"></main>
    <article id="doc-article">
      <h2 id="intro">Introduction</h2>
      <h2 id="getting-started">Getting Started</h2>
      <h3 id="installation">Installation</h3>
    </article>
  `

  const main = document.getElementById('docs-main') as HTMLElement
  Object.defineProperty(main, 'scrollTop', { value: 0, writable: true })
  main.scrollTo = jest.fn()
  main.getBoundingClientRect = jest.fn(() => ({
    top: 0,
    left: 0,
    width: 1000,
    height: 800,
    right: 1000,
    bottom: 800,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  }))

  const intro = document.getElementById('intro') as HTMLElement
  const gettingStarted = document.getElementById('getting-started') as HTMLElement
  const installation = document.getElementById('installation') as HTMLElement

  intro.getBoundingClientRect = jest.fn(() => ({ top: 120, left: 0, width: 0, height: 20, right: 0, bottom: 140, x: 0, y: 120, toJSON: () => ({}) }))
  gettingStarted.getBoundingClientRect = jest.fn(() => ({ top: 320, left: 0, width: 0, height: 20, right: 0, bottom: 340, x: 0, y: 320, toJSON: () => ({}) }))
  installation.getBoundingClientRect = jest.fn(() => ({ top: 520, left: 0, width: 0, height: 20, right: 0, bottom: 540, x: 0, y: 520, toJSON: () => ({}) }))
})

afterEach(() => {
  jest.runOnlyPendingTimers()
  jest.useRealTimers()
  jest.restoreAllMocks()
})

describe('TableOfContents', () => {
  it('renders toc title and headings on doc pages', () => {
    render(<TableOfContents />)
    act(() => {
      jest.runAllTimers()
    })

    expect(screen.getAllByText('On this page').length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: 'Introduction' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Getting Started' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Installation' })).toBeInTheDocument()
  })

  it('returns null when not on doc detail page and no headings', () => {
    mockPathname = '/en/docs'
    document.getElementById('doc-article')?.remove()

    const { container } = render(<TableOfContents />)
    act(() => {
      jest.runAllTimers()
    })

    expect(container.firstChild).toBeNull()
  })

  it('scrolls main container when toc link clicked', () => {
    render(<TableOfContents />)
    act(() => {
      jest.runAllTimers()
    })

    fireEvent.click(screen.getByRole('link', { name: 'Installation' }))

    const main = document.getElementById('docs-main') as HTMLElement
    expect(main.scrollTo).toHaveBeenCalled()
  })
})
