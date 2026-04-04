import { fireEvent, render, screen } from '@testing-library/react'
import { Header } from '@/components/layout/Header'

let mockPathname = '/en/docs/getting-started/introduction'

jest.mock('next-intl', () => ({
  useLocale: () => 'en',
}))

const push = jest.fn()

jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({
    push,
    replace: jest.fn(),
  }),
}))

jest.mock('next/link', () => {
  return ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
})

jest.mock('@/components/search/SearchDialog', () => ({
  SearchDialog: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="search-dialog" /> : null,
}))

jest.mock('lucide-react', () => ({
  Search: () => <svg data-testid="search-icon" />,
  Menu: () => <svg data-testid="menu-icon" />,
  X: () => <svg data-testid="x-icon" />,
  Languages: () => <svg data-testid="languages-icon" />,
  ChevronDown: () => <svg data-testid="chevron-down-icon" />,
  Command: () => <svg data-testid="command-icon" />,
  SunMedium: () => <svg data-testid="sun-icon" />,
  MoonStar: () => <svg data-testid="moon-icon" />,
}))

describe('Header', () => {
  beforeEach(() => {
    mockPathname = '/en/docs/getting-started/introduction'
    push.mockReset()
  })

  it('renders brand and nav entries', () => {
    render(<Header onMobileMenuToggle={() => {}} isMobileMenuOpen={false} />)
    expect(screen.getByText('NexDoc')).toBeInTheDocument()
    expect(screen.getByText('Getting Started')).toBeInTheDocument()
    expect(screen.getByText('Developer Guide')).toBeInTheDocument()
  })

  it('opens search dialog when clicking search button', () => {
    render(<Header onMobileMenuToggle={() => {}} isMobileMenuOpen={false} />)
    fireEvent.click(screen.getByRole('button', { name: /search docs/i }))
    expect(screen.getByTestId('search-dialog')).toBeInTheDocument()
  })

  it('renders menu icon based on mobile menu state', () => {
    const { rerender } = render(
      <Header onMobileMenuToggle={() => {}} isMobileMenuOpen={false} />
    )
    expect(screen.getByTestId('menu-icon')).toBeInTheDocument()

    rerender(<Header onMobileMenuToggle={() => {}} isMobileMenuOpen />)
    expect(screen.getByTestId('x-icon')).toBeInTheDocument()
  })

  it('opens locale dropdown and switches locale', () => {
    render(<Header onMobileMenuToggle={() => {}} isMobileMenuOpen={false} />)
    fireEvent.click(screen.getByRole('button', { name: /switch language/i }))
    fireEvent.click(screen.getByRole('button', { name: /简体中文/ }))

    expect(push).toHaveBeenCalled()
  })
})
