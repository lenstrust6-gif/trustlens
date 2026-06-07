import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SubmitProduct from '@/components/home/SubmitProduct'

global.fetch = jest.fn()

describe('SubmitProduct Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  it('renders form with product name and email inputs', () => {
    render(<SubmitProduct locale="in" />)

    expect(screen.getByPlaceholderText('Product name or Amazon.in URL')).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText('Your email (optional — one notification only)')
    ).toBeInTheDocument()
  })

  it('renders submit button', () => {
    render(<SubmitProduct locale="in" />)

    expect(screen.getByRole('button', { name: /submit product request/i })).toBeInTheDocument()
  })

  it('requires product name to submit', () => {
    render(<SubmitProduct locale="in" />)

    const button = screen.getByRole('button', { name: /submit product request/i })

    // Button should be disabled when empty
    expect(button).toBeDisabled()

    const emailInput = screen.getByPlaceholderText(
      'Your email (optional — one notification only)'
    ) as HTMLInputElement
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

    // Still disabled without product name
    expect(button).toBeDisabled()
  })

  it('enables button when product name is entered', () => {
    render(<SubmitProduct locale="in" />)

    const productInput = screen.getByPlaceholderText('Product name or Amazon.in URL')
    const button = screen.getByRole('button', { name: /submit product request/i })

    fireEvent.change(productInput, { target: { value: 'boAt Airdopes' } })

    expect(button).not.toBeDisabled()
  })

  it('submits form with product name only', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
    })

    render(<SubmitProduct locale="in" />)

    const productInput = screen.getByPlaceholderText('Product name or Amazon.in URL')
    const button = screen.getByRole('button', { name: /submit product request/i })

    fireEvent.change(productInput, { target: { value: 'Sony WH-1000XM5' } })
    fireEvent.click(button)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/v1/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('Sony WH-1000XM5'),
      })
    })
  })

  it('submits form with product name and email', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
    })

    render(<SubmitProduct locale="in" />)

    const productInput = screen.getByPlaceholderText('Product name or Amazon.in URL')
    const emailInput = screen.getByPlaceholderText(
      'Your email (optional — one notification only)'
    )
    const button = screen.getByRole('button', { name: /submit product request/i })

    fireEvent.change(productInput, { target: { value: 'Mi Power Bank' } })
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } })
    fireEvent.click(button)

    await waitFor(() => {
      const callBody = (global.fetch as jest.Mock).mock.calls[0][1].body
      expect(callBody).toContain('Mi Power Bank')
      expect(callBody).toContain('user@example.com')
    })
  })

  it('shows success message after submission', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
    })

    render(<SubmitProduct locale="in" />)

    const productInput = screen.getByPlaceholderText('Product name or Amazon.in URL')
    const button = screen.getByRole('button', { name: /submit product request/i })

    fireEvent.change(productInput, { target: { value: 'Test Product' } })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText(/received/i)).toBeInTheDocument()
      expect(screen.getByText(/24 hours/i)).toBeInTheDocument()
    })
  })

  it('clears form inputs after successful submission', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
    })

    render(<SubmitProduct locale="in" />)

    const productInput = screen.getByPlaceholderText(
      'Product name or Amazon.in URL'
    ) as HTMLInputElement
    const emailInput = screen.getByPlaceholderText(
      'Your email (optional — one notification only)'
    ) as HTMLInputElement
    const button = screen.getByRole('button', { name: /submit product request/i })

    fireEvent.change(productInput, { target: { value: 'Test Product' } })
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.click(button)

    await waitFor(() => {
      expect(productInput.value).toBe('')
      expect(emailInput.value).toBe('')
    })
  })

  it('shows error message on API failure', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
    })

    render(<SubmitProduct locale="in" />)

    const productInput = screen.getByPlaceholderText('Product name or Amazon.in URL')
    const button = screen.getByRole('button', { name: /submit product request/i })

    fireEvent.change(productInput, { target: { value: 'Test Product' } })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    })
  })

  it('shows error message on network failure', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    render(<SubmitProduct locale="in" />)

    const productInput = screen.getByPlaceholderText('Product name or Amazon.in URL')
    const button = screen.getByRole('button', { name: /submit product request/i })

    fireEvent.change(productInput, { target: { value: 'Test Product' } })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    })
  })

  it('shows loading state during submission', async () => {
    ;(global.fetch as jest.Mock).mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 100))
    )

    render(<SubmitProduct locale="in" />)

    const productInput = screen.getByPlaceholderText('Product name or Amazon.in URL')
    const button = screen.getByRole('button', { name: /submit product request/i })

    fireEvent.change(productInput, { target: { value: 'Test Product' } })
    fireEvent.click(button)

    expect(screen.getByText(/submitting/i)).toBeInTheDocument()
    expect(button).toBeDisabled()

    await waitFor(() => {
      expect(screen.getByText(/received/i)).toBeInTheDocument()
    })
  })

  it('accepts locale prop and uses it in API call', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
    })

    render(<SubmitProduct locale="us" />)

    const productInput = screen.getByPlaceholderText('Product name or Amazon.in URL')
    const button = screen.getByRole('button', { name: /submit product request/i })

    fireEvent.change(productInput, { target: { value: 'Test' } })
    fireEvent.click(button)

    await waitFor(() => {
      const callBody = (global.fetch as jest.Mock).mock.calls[0][1].body
      expect(callBody).toContain('"locale":"us"')
    })
  })

  it('allows optional email field', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
    })

    render(<SubmitProduct locale="in" />)

    const productInput = screen.getByPlaceholderText('Product name or Amazon.in URL')
    const button = screen.getByRole('button', { name: /submit product request/i })

    fireEvent.change(productInput, { target: { value: 'Test Product' } })
    fireEvent.click(button)

    await waitFor(() => {
      const callBody = JSON.parse(
        (global.fetch as jest.Mock).mock.calls[0][1].body
      )
      expect(callBody.email).toBeNull()
    })
  })

  it('prevents double submission', async () => {
    ;(global.fetch as jest.Mock).mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 200))
    )

    render(<SubmitProduct locale="in" />)

    const productInput = screen.getByPlaceholderText('Product name or Amazon.in URL')
    const button = screen.getByRole('button', { name: /submit product request/i })

    fireEvent.change(productInput, { target: { value: 'Test Product' } })
    fireEvent.click(button)
    fireEvent.click(button) // Try to click again

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })
  })
})
