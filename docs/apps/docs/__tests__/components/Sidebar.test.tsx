import { render, screen } from '@testing-library/react'
import { Sidebar } from '@/components/layout/Sidebar'

let mockPathname = '/en/docs/getting-started/introduction'

jest.mock('next-intl', () => ({
  useLocale: () => 'en',
}))

jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}))

jest.mock('next/link', () => {
  return ({ children, href, className, ...props }: any) => (
    <a href={href} className={className} {...props}>
      {children}
    </a>
  )
})

describe('Sidebar', () => {
  it('shows only getting-started section for a getting-started page', () => {
    mockPathname = '/en/docs/getting-started/introduction'
    render(<Sidebar />)

    expect(screen.getByText('Setup')).toBeInTheDocument()
    expect(screen.getByText('Introduction')).toBeInTheDocument()
    expect(screen.getByText('Installation and First Run')).toBeInTheDocument()
    expect(screen.queryByText('Information Architecture')).not.toBeInTheDocument()
  })

  it('shows developer-guide sections for a developer-guide page', () => {
    mockPathname = '/en/docs/developer-guide/information-architecture'
    render(<Sidebar />)

    expect(screen.getByText('Guide')).toBeInTheDocument()
    expect(screen.getByText('Information Architecture')).toBeInTheDocument()
    expect(screen.queryByText('Setup')).not.toBeInTheDocument()
  })

  it('highlights current page link', () => {
    mockPathname = '/en/docs/getting-started/introduction'
    render(<Sidebar />)

    const activeLink = screen.getByRole('link', { name: 'Introduction' })
    expect(activeLink).toHaveClass('bg-[var(--bg-elevated)]')
  })

  it('renders expected aside width class', () => {
    const { container } = render(<Sidebar />)
    const sidebar = container.querySelector('aside')
    expect(sidebar).toHaveClass('w-[280px]')
  })
})
