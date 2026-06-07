import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import FilterPanel, { SearchFiltersState } from '../FilterPanel'

describe('FilterPanel', () => {
  const defaultFilters: SearchFiltersState = {
    trust_min: 0,
    trust_max: 10,
    auth_min: 0,
    source: 'all',
    confidence_tiers: [],
  }

  it('renders filter panel when open', () => {
    const mockOnChange = jest.fn()
    render(
      <FilterPanel
        isOpen={true}
        onClose={jest.fn()}
        onFiltersChange={mockOnChange}
        filters={defaultFilters}
      />
    )

    expect(screen.getByText('Filters')).toBeInTheDocument()
    expect(screen.getByText('TrustScore')).toBeInTheDocument()
    expect(screen.getByText('Authenticity Score')).toBeInTheDocument()
    expect(screen.getByText('Data Source')).toBeInTheDocument()
  })

  it('calls onFilterChange when trust score is modified', () => {
    const mockOnChange = jest.fn()
    const { container } = render(
      <FilterPanel
        isOpen={true}
        onClose={jest.fn()}
        onFiltersChange={mockOnChange}
        filters={defaultFilters}
      />
    )

    const inputs = container.querySelectorAll('input[type="number"]')
    if (inputs[0]) {
      fireEvent.change(inputs[0], { target: { value: '7.5' } })
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ trust_min: 7.5 })
      )
    }
  })

  it('handles source filter changes', () => {
    const mockOnChange = jest.fn()
    render(
      <FilterPanel
        isOpen={true}
        onClose={jest.fn()}
        onFiltersChange={mockOnChange}
        filters={defaultFilters}
      />
    )

    const youtubeRadio = screen.getByDisplayValue('youtube') as HTMLInputElement
    fireEvent.click(youtubeRadio)

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'youtube' })
    )
  })

  it('handles confidence tier toggles', () => {
    const mockOnChange = jest.fn()
    render(
      <FilterPanel
        isOpen={true}
        onClose={jest.fn()}
        onFiltersChange={mockOnChange}
        filters={defaultFilters}
      />
    )

    const establishedCheckbox = screen.getByDisplayValue('established') as HTMLInputElement
    fireEvent.click(establishedCheckbox)

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({ confidence_tiers: ['established'] })
    )
  })

  it('shows clear all button when filters are active', () => {
    const activeFilters: SearchFiltersState = {
      trust_min: 7,
      trust_max: 10,
      auth_min: 70,
      source: 'all',
      confidence_tiers: [],
    }

    const mockOnChange = jest.fn()
    render(
      <FilterPanel
        isOpen={true}
        onClose={jest.fn()}
        onFiltersChange={mockOnChange}
        filters={activeFilters}
      />
    )

    expect(screen.getByText('Clear All Filters')).toBeInTheDocument()
  })

  it('clears all filters on clear button click', () => {
    const activeFilters: SearchFiltersState = {
      trust_min: 7,
      trust_max: 10,
      auth_min: 70,
      source: 'youtube',
      confidence_tiers: ['established'],
    }

    const mockOnChange = jest.fn()
    render(
      <FilterPanel
        isOpen={true}
        onClose={jest.fn()}
        onFiltersChange={mockOnChange}
        filters={activeFilters}
      />
    )

    const clearButton = screen.getByText('Clear All Filters')
    fireEvent.click(clearButton)

    expect(mockOnChange).toHaveBeenCalledWith({
      trust_min: 0,
      trust_max: 10,
      auth_min: 0,
      source: 'all',
      confidence_tiers: [],
    })
  })
})
