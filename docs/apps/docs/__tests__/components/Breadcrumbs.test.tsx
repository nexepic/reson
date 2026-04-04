import { render, screen } from '@testing-library/react'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'

let mockPathname = '/en/docs/getting-started/introduction'

jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}))

jest.mock('next-intl', () => ({
  useLocale: () => 'en',
}))

jest.mock('next/link', () => {
  return ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
})

jest.mock('lucide-react', () => ({
  ChevronRight: () => <svg data-testid="chevron-right-icon" />,
  House: () => <svg data-testid="home-icon" />,
}))

describe('Breadcrumbs', () => {
  it('renders breadcrumbs for docs page', () => {
    render(<Breadcrumbs />)

    expect(screen.getByTestId('home-icon')).toBeInTheDocument()
    expect(screen.getByText('Docs')).toBeInTheDocument()
    expect(screen.getByText('Setup')).toBeInTheDocument()
    expect(screen.getByText('Introduction')).toBeInTheDocument()
  })

  it('renders null outside docs detail page', () => {
    mockPathname = '/en'
    const { container } = render(<Breadcrumbs />)
    expect(container.firstChild).toBeNull()
  })

  it('has navigation landmark', () => {
    mockPathname = '/en/docs/getting-started/introduction'
    render(<Breadcrumbs />)

    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument()
  })
})
