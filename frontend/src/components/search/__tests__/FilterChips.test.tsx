import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import FilterChips from '../FilterChips'
import { SearchFiltersState } from '../FilterPanel'

describe('FilterChips', () => {
  const defaultFilters: SearchFiltersState = {
    trust_min: 0,
    trust_max: 10,
    auth_min: 0,
    source: 'all',
    confidence_tiers: [],
  }

  it('returns null when no filters are active', () => {
    const mockOnRemove = jest.fn()
    const mockOnClearAll = jest.fn()

    const { container } = render(
      <FilterChips
        filters={defaultFilters}
        onRemoveFilter={mockOnRemove}
        onClearAll={mockOnClearAll}
      />
    )

    expect(container.firstChild).toBeNull()
  })

  it('displays trust score chip', () => {
    const filters: SearchFiltersState = {
      ...defaultFilters,
      trust_min: 7.5,
      trust_max: 10,
    }

    const mockOnRemove = jest.fn()
    const mockOnClearAll = jest.fn()

    render(
      <FilterChips
        filters={filters}
        onRemoveFilter={mockOnRemove}
        onClearAll={mockOnClearAll}
      />
    )

    expect(screen.getByText(/TrustScore: 7.5 - 10/)).toBeInTheDocument()
  })

  it('displays authenticity score chip', () => {
    const filters: SearchFiltersState = {
      ...defaultFilters,
      auth_min: 70,
    }

    const mockOnRemove = jest.fn()
    const mockOnClearAll = jest.fn()

    render(
      <FilterChips
        filters={filters}
        onRemoveFilter={mockOnRemove}
        onClearAll={mockOnClearAll}
      />
    )

    expect(screen.getByText(/Auth: 70\+/)).toBeInTheDocument()
  })

  it('displays source chip', () => {
    const filters: SearchFiltersState = {
      ...defaultFilters,
      source: 'youtube',
    }

    const mockOnRemove = jest.fn()
    const mockOnClearAll = jest.fn()

    render(
      <FilterChips
        filters={filters}
        onRemoveFilter={mockOnRemove}
        onClearAll={mockOnClearAll}
      />
    )

    expect(screen.getByText(/YouTube/)).toBeInTheDocument()
  })

  it('displays confidence tier chips', () => {
    const filters: SearchFiltersState = {
      ...defaultFilters,
      confidence_tiers: ['established', 'mature'],
    }

    const mockOnRemove = jest.fn()
    const mockOnClearAll = jest.fn()

    render(
      <FilterChips
        filters={filters}
        onRemoveFilter={mockOnRemove}
        onClearAll={mockOnClearAll}
      />
    )

    expect(screen.getByText(/Established/)).toBeInTheDocument()
    expect(screen.getByText(/Mature/)).toBeInTheDocument()
  })

  it('calls onRemoveFilter when chip close button is clicked', () => {
    const filters: SearchFiltersState = {
      ...defaultFilters,
      auth_min: 70,
    }

    const mockOnRemove = jest.fn()
    const mockOnClearAll = jest.fn()

    const { container } = render(
      <FilterChips
        filters={filters}
        onRemoveFilter={mockOnRemove}
        onClearAll={mockOnClearAll}
      />
    )

    const closeButton = container.querySelector('button[type="button"]')
    if (closeButton) {
      fireEvent.click(closeButton)
      expect(mockOnRemove).toHaveBeenCalledWith('auth_min')
    }
  })

  it('calls onClearAll when clear all link is clicked', () => {
    const filters: SearchFiltersState = {
      ...defaultFilters,
      trust_min: 7,
      auth_min: 70,
    }

    const mockOnRemove = jest.fn()
    const mockOnClearAll = jest.fn()

    render(
      <FilterChips
        filters={filters}
        onRemoveFilter={mockOnRemove}
        onClearAll={mockOnClearAll}
      />
    )

    const clearAllLink = screen.getByText('Clear all')
    fireEvent.click(clearAllLink)

    expect(mockOnClearAll).toHaveBeenCalled()
  })

  it('displays multiple filter chips', () => {
    const filters: SearchFiltersState = {
      trust_min: 7,
      trust_max: 10,
      auth_min: 70,
      source: 'youtube',
      confidence_tiers: ['established'],
    }

    const mockOnRemove = jest.fn()
    const mockOnClearAll = jest.fn()

    render(
      <FilterChips
        filters={filters}
        onRemoveFilter={mockOnRemove}
        onClearAll={mockOnClearAll}
      />
    )

    expect(screen.getByText(/TrustScore/)).toBeInTheDocument()
    expect(screen.getByText(/Auth/)).toBeInTheDocument()
    expect(screen.getByText(/YouTube/)).toBeInTheDocument()
    expect(screen.getByText(/Established/)).toBeInTheDocument()
  })
})
