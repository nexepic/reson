import { render, screen } from '@testing-library/react'
import { useMDXComponents } from '@/mdx-components'

jest.mock('next/link', () => {
  return ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
})

jest.mock('lucide-react', () => ({
  Link2: (props: any) => <svg data-testid="heading-anchor-icon" {...props} />,
}))

describe('MDX heading anchors', () => {
  it('only uses the icon as the clickable anchor for h2', () => {
    const components = useMDXComponents({})
    const H2 = components.h2 as any

    render(<H2 id="introduction">Introduction</H2>)

    const headingText = screen.getByText('Introduction')
    expect(headingText.closest('a')).toBeNull()

    const anchor = screen.getByRole('link', { name: 'Link to section: Introduction' })
    expect(anchor).toHaveAttribute('href', '#introduction')
    expect(anchor.querySelector('[data-testid="heading-anchor-icon"]')).not.toBeNull()
  })

  it('only uses the icon as the clickable anchor for h3', () => {
    const components = useMDXComponents({})
    const H3 = components.h3 as any

    render(<H3 id="installation">Installation</H3>)

    const headingText = screen.getByText('Installation')
    expect(headingText.closest('a')).toBeNull()

    const anchor = screen.getByRole('link', { name: 'Link to section: Installation' })
    expect(anchor).toHaveAttribute('href', '#installation')
    expect(anchor.querySelector('[data-testid="heading-anchor-icon"]')).not.toBeNull()
  })
})
