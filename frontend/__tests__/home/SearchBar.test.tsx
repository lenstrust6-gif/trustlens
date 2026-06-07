import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import SearchBar from '@/components/shared/SearchBar'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

describe('SearchBar Component', () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
  })

  it('renders search input and submit button', () => {
    render(<SearchBar locale="in" />)

    expect(screen.getByPlaceholderText('Search any product...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /analyse/i })).toBeInTheDocument()
  })

  it('updates input value on user typing', () => {
    render(<SearchBar locale="in" />)

    const input = screen.getByPlaceholderText(
      'Search any product...'
    ) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'boAt Airdopes' } })

    expect(input.value).toBe('boAt Airdopes')
  })

  it('submits search on Enter key', async () => {
    const mockOnSearch = jest.fn().mockResolvedValue(undefined)
    render(<SearchBar locale="in" onSearch={mockOnSearch} />)

    const input = screen.getByPlaceholderText('Search any product...')
    fireEvent.change(input, { target: { value: 'Sony WH-1000XM5' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('Sony WH-1000XM5')
    })
  })

  it('submits search on button click', async () => {
    const mockOnSearch = jest.fn().mockResolvedValue(undefined)
    render(<SearchBar locale="in" onSearch={mockOnSearch} />)

    const input = screen.getByPlaceholderText('Search any product...')
    const button = screen.getByRole('button', { name: /analyse/i })

    fireEvent.change(input, { target: { value: 'Mi Power Bank' } })
    fireEvent.click(button)

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('Mi Power Bank')
    })
  })

  it('navigates to search page when no onSearch callback provided', async () => {
    render(<SearchBar locale="in" />)

    const input = screen.getByPlaceholderText('Search any product...')
    const button = screen.getByRole('button', { name: /analyse/i })

    fireEvent.change(input, { target: { value: 'Noise ColorFit' } })
    fireEvent.click(button)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/in/search?q=Noise%20ColorFit')
    })
  })

  it('does not submit with empty query', () => {
    const mockOnSearch = jest.fn()
    render(<SearchBar locale="in" onSearch={mockOnSearch} />)

    const button = screen.getByRole('button', { name: /analyse/i })
    fireEvent.click(button)

    expect(mockOnSearch).not.toHaveBeenCalled()
  })

  it('shows loading state when isLoading prop is true', () => {
    render(<SearchBar locale="in" isLoading={true} />)

    const button = screen.getByRole('button', { name: /searching/i })
    expect(button).toBeDisabled()
  })

  it('disables button during submission', async () => {
    const mockOnSearch = jest.fn(() => new Promise((resolve) => setTimeout(resolve, 100)))
    render(<SearchBar locale="in" onSearch={mockOnSearch} />)

    const input = screen.getByPlaceholderText('Search any product...')
    const button = screen.getByRole('button', { name: /analyse/i })

    fireEvent.change(input, { target: { value: 'test' } })
    fireEvent.click(button)

    expect(button).toBeDisabled()

    await waitFor(() => {
      expect(button).not.toBeDisabled()
    })
  })

  it('has proper aria labels for accessibility', () => {
    render(<SearchBar locale="in" />)

    expect(screen.getByLabelText('Search for a product')).toBeInTheDocument()
    expect(screen.getByLabelText('Analyse product reviews')).toBeInTheDocument()
  })

  it('accepts custom placeholder text', () => {
    render(<SearchBar locale="in" placeholder="Find your product..." />)

    expect(screen.getByPlaceholderText('Find your product...')).toBeInTheDocument()
  })

  it('trims whitespace from query before submission', async () => {
    const mockOnSearch = jest.fn().mockResolvedValue(undefined)
    render(<SearchBar locale="in" onSearch={mockOnSearch} />)

    const input = screen.getByPlaceholderText('Search any product...')
    const button = screen.getByRole('button', { name: /analyse/i })

    fireEvent.change(input, { target: { value: '  Sony  ' } })
    fireEvent.click(button)

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('  Sony  ')
    })
  })
})
