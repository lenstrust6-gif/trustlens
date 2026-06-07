import { render, screen, waitFor } from '@testing-library/react'
import AuthScoreBar from '@/components/shared/AuthScoreBar'

class MockIntersectionObserver {
  observe = jest.fn()
  unobserve = jest.fn()
  disconnect = jest.fn()

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
  }

  callback: IntersectionObserverCallback

  trigger(entries: Partial<IntersectionObserverEntry>[]) {
    this.callback(entries as IntersectionObserverEntry[], this as any)
  }
}

let mockIntersectionObserver: MockIntersectionObserver

beforeEach(() => {
  mockIntersectionObserver = new MockIntersectionObserver(() => {})
  window.IntersectionObserver = MockIntersectionObserver as any
})

describe('AuthScoreBar Component', () => {
  it('renders score display', () => {
    render(<AuthScoreBar score={75} animated={false} />)

    expect(screen.getByText(/75\/100/)).toBeInTheDocument()
  })

  it('shows green status for score >= 70', () => {
    render(<AuthScoreBar score={75} animated={false} />)

    expect(screen.getByText('✓ Full weight')).toBeInTheDocument()
    const status = screen.getByText('✓ Full weight')
    expect(status).toHaveStyle({ color: 'var(--green)' })
  })

  it('shows amber status for score 40-69', () => {
    render(<AuthScoreBar score={52} animated={false} />)

    expect(screen.getByText('~ Reduced weight')).toBeInTheDocument()
    const status = screen.getByText('~ Reduced weight')
    expect(status).toHaveStyle({ color: 'var(--amber)' })
  })

  it('shows red status for score < 40', () => {
    render(<AuthScoreBar score={28} animated={false} />)

    expect(screen.getByText('✗ Excluded')).toBeInTheDocument()
    const status = screen.getByText('✗ Excluded')
    expect(status).toHaveStyle({ color: 'var(--red)' })
  })

  it('renders bar with correct fill percentage', () => {
    const { container } = render(<AuthScoreBar score={75} animated={false} />)

    const fillBar = container.querySelector('div[style*="width"]')
    expect(fillBar).toBeInTheDocument()
  })

  it('animates score on intersection', async () => {
    render(<AuthScoreBar score={80} animated={true} />)

    mockIntersectionObserver.trigger([{ isIntersecting: true }])

    await waitFor(() => {
      expect(screen.getByText(/80\/100/)).toBeInTheDocument()
    })
  })

  it('respects delay prop for staggered animation', async () => {
    const startTime = Date.now()
    render(<AuthScoreBar score={80} animated={true} delay={200} />)

    mockIntersectionObserver.trigger([{ isIntersecting: true }])

    // Should not show animated value immediately due to delay
    expect(screen.queryByText(/80\/100/)).not.toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText(/80\/100/)).toBeInTheDocument()
    }, { timeout: 1100 })

    const endTime = Date.now()
    expect(endTime - startTime).toBeGreaterThan(100)
  })

  it('does not animate when animated=false', () => {
    render(<AuthScoreBar score={75} animated={false} />)

    mockIntersectionObserver.trigger([{ isIntersecting: true }])

    // Should show final value immediately
    expect(screen.getByText(/75\/100/)).toBeInTheDocument()
  })

  it('renders boundary scores correctly', () => {
    const { rerender } = render(<AuthScoreBar score={40} animated={false} />)
    expect(screen.getByText('~ Reduced weight')).toBeInTheDocument()

    rerender(<AuthScoreBar score={39} animated={false} />)
    expect(screen.getByText('✗ Excluded')).toBeInTheDocument()

    rerender(<AuthScoreBar score={70} animated={false} />)
    expect(screen.getByText('✓ Full weight')).toBeInTheDocument()

    rerender(<AuthScoreBar score={69} animated={false} />)
    expect(screen.getByText('~ Reduced weight')).toBeInTheDocument()
  })

  it('renders 0 score', () => {
    render(<AuthScoreBar score={0} animated={false} />)

    expect(screen.getByText(/0\/100/)).toBeInTheDocument()
    expect(screen.getByText('✗ Excluded')).toBeInTheDocument()
  })

  it('renders 100 score', () => {
    render(<AuthScoreBar score={100} animated={false} />)

    expect(screen.getByText(/100\/100/)).toBeInTheDocument()
    expect(screen.getByText('✓ Full weight')).toBeInTheDocument()
  })

  it('updates when score prop changes', () => {
    const { rerender } = render(<AuthScoreBar score={50} animated={false} />)

    expect(screen.getByText(/50\/100/)).toBeInTheDocument()

    rerender(<AuthScoreBar score={75} animated={false} />)

    expect(screen.getByText(/75\/100/)).toBeInTheDocument()
  })

  it('connects and disconnects observer', () => {
    const { unmount } = render(<AuthScoreBar score={75} animated={true} />)

    expect(mockIntersectionObserver.observe).toHaveBeenCalled()

    unmount()

    expect(mockIntersectionObserver.disconnect).toHaveBeenCalled()
  })

  it('displays monospace font for score', () => {
    const { container } = render(<AuthScoreBar score={75} animated={false} />)

    const scoreElement = screen.getByText(/75\/100/)
    expect(scoreElement).toHaveStyle({ fontFamily: 'var(--font-mono)' })
  })

  it('accepts custom className', () => {
    const { container } = render(
      <AuthScoreBar score={75} animated={false} className="custom-class" />
    )

    const wrapper = container.firstChild
    expect(wrapper).toHaveClass('custom-class')
  })
})
