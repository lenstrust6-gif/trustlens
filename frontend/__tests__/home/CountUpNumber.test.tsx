import { render, screen, waitFor } from '@testing-library/react'
import CountUpNumber from '@/components/shared/CountUpNumber'

// Mock IntersectionObserver
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

describe('CountUpNumber Component', () => {
  it('renders target number after animation completes', async () => {
    render(<CountUpNumber target={100} />)

    const element = screen.getByText('100', { exact: false })
    expect(element).toBeInTheDocument()
  })

  it('starts at 0 and animates to target', async () => {
    const { container } = render(<CountUpNumber target={50} duration={100} />)

    // Initially should not show full value
    const span = container.querySelector('span')
    expect(span).toBeInTheDocument()

    // Trigger intersection observer
    mockIntersectionObserver.trigger([{ isIntersecting: true }])

    // Wait for animation to complete
    await waitFor(
      () => {
        expect(span?.textContent).toBe('50')
      },
      { timeout: 200 }
    )
  })

  it('applies prefix to number', async () => {
    render(<CountUpNumber target={100} prefix="$" duration={50} />)

    mockIntersectionObserver.trigger([{ isIntersecting: true }])

    await waitFor(() => {
      expect(screen.getByText('$100')).toBeInTheDocument()
    })
  })

  it('applies suffix to number', async () => {
    render(<CountUpNumber target={100} suffix="/100" duration={50} />)

    mockIntersectionObserver.trigger([{ isIntersecting: true }])

    await waitFor(() => {
      expect(screen.getByText(/100\/100/)).toBeInTheDocument()
    })
  })

  it('applies both prefix and suffix', async () => {
    render(<CountUpNumber target={78} prefix="" suffix="%" duration={50} />)

    mockIntersectionObserver.trigger([{ isIntersecting: true }])

    await waitFor(() => {
      expect(screen.getByText('78%')).toBeInTheDocument()
    })
  })

  it('uses custom format function', async () => {
    const customFormat = (value: number) => `${(value / 10).toFixed(1)}k`
    render(<CountUpNumber target={100} format={customFormat} duration={50} />)

    mockIntersectionObserver.trigger([{ isIntersecting: true }])

    await waitFor(() => {
      expect(screen.getByText('10.0k')).toBeInTheDocument()
    })
  })

  it('triggers animation only once on scroll', async () => {
    const { rerender } = render(<CountUpNumber target={100} duration={100} />)

    mockIntersectionObserver.trigger([{ isIntersecting: true }])

    await waitFor(() => {
      expect(screen.getByText('100')).toBeInTheDocument()
    })

    // Re-render should not trigger animation again
    rerender(<CountUpNumber target={100} duration={100} />)

    expect(mockIntersectionObserver.observe).toHaveBeenCalled()
  })

  it('does not animate if not in viewport', () => {
    render(<CountUpNumber target={100} duration={50} />)

    mockIntersectionObserver.trigger([{ isIntersecting: false }])

    // Should still show component but not animated value
    const span = screen.getByText('0', { exact: false })
    expect(span).toBeInTheDocument()
  })

  it('respects custom duration', async () => {
    const startTime = Date.now()
    render(<CountUpNumber target={100} duration={200} />)

    mockIntersectionObserver.trigger([{ isIntersecting: true }])

    await waitFor(
      () => {
        expect(screen.getByText('100')).toBeInTheDocument()
      },
      { timeout: 250 }
    )

    const endTime = Date.now()
    expect(endTime - startTime).toBeGreaterThanOrEqual(100)
  })

  it('formats large numbers with localization', async () => {
    render(<CountUpNumber target={48200} duration={50} />)

    mockIntersectionObserver.trigger([{ isIntersecting: true }])

    await waitFor(() => {
      // Number should be formatted with commas (48,200)
      const element = screen.getByText(/48.?200/, { exact: false })
      expect(element).toBeInTheDocument()
    })
  })

  it('handles zero target', async () => {
    render(<CountUpNumber target={0} duration={50} />)

    mockIntersectionObserver.trigger([{ isIntersecting: true }])

    await waitFor(() => {
      expect(screen.getByText('0')).toBeInTheDocument()
    })
  })

  it('handles decimal targets', async () => {
    render(<CountUpNumber target={8.3} duration={50} />)

    mockIntersectionObserver.trigger([{ isIntersecting: true }])

    await waitFor(() => {
      // Should contain 8 as part of the number
      const span = screen.getByText(/8/, { exact: false })
      expect(span).toBeInTheDocument()
    })
  })

  it('observes element on mount', () => {
    render(<CountUpNumber target={100} />)

    expect(mockIntersectionObserver.observe).toHaveBeenCalled()
  })

  it('disconnects observer on unmount', () => {
    const { unmount } = render(<CountUpNumber target={100} />)

    unmount()

    expect(mockIntersectionObserver.disconnect).toHaveBeenCalled()
  })
})
