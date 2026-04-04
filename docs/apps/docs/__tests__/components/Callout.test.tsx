import { fireEvent, render, screen } from '@testing-library/react'
import { Callout } from '@/components/mdx/Callout'

jest.mock('lucide-react', () => ({
  Info: () => <svg data-testid="info-icon" />,
  AlertTriangle: () => <svg data-testid="warning-icon" />,
  AlertCircle: () => <svg data-testid="danger-icon" />,
  CheckCircle2: () => <svg data-testid="success-icon" />,
  ChevronDown: () => <svg data-testid="chevron-down-icon" />,
  ChevronRight: () => <svg data-testid="chevron-right-icon" />,
}))

describe('Callout', () => {
  it('renders default info title and content', () => {
    render(
      <Callout type="info">
        <p>Info content</p>
      </Callout>
    )

    expect(screen.getByText('Note')).toBeInTheDocument()
    expect(screen.getByText('Info content')).toBeInTheDocument()
    expect(screen.getByTestId('info-icon')).toBeInTheDocument()
  })

  it('renders warning/danger/success variants', () => {
    const { rerender } = render(
      <Callout type="warning" title="Warning">
        <p>Warning content</p>
      </Callout>
    )
    expect(screen.getByTestId('warning-icon')).toBeInTheDocument()

    rerender(
      <Callout type="danger" title="Danger">
        <p>Danger content</p>
      </Callout>
    )
    expect(screen.getByTestId('danger-icon')).toBeInTheDocument()

    rerender(
      <Callout type="success" title="Success">
        <p>Success content</p>
      </Callout>
    )
    expect(screen.getByTestId('success-icon')).toBeInTheDocument()
  })

  it('toggles compact state with collapse button', () => {
    render(
      <Callout type="info" title="Info">
        <p>Collapsible content</p>
      </Callout>
    )

    const toggleButton = screen.getByRole('button', { name: 'Collapse' })
    fireEvent.click(toggleButton)
    expect(screen.queryByText('Collapsible content')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Expand' }))
    expect(screen.getByText('Collapsible content')).toBeInTheDocument()
  })
})
