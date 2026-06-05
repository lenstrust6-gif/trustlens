'use client'

import { useState } from 'react'
import SortDropdown from './SortDropdown'
import PriceRangeSlider from './PriceRangeSlider'
import BrandFilter from './BrandFilter'
import RatingFilter from './RatingFilter'
import { useSearchParams } from 'next/navigation'

interface FilterSidebarProps {
  availableBrands?: string[]
  onFiltersChange?: () => void
  isOpen?: boolean
}

export default function FilterSidebar({
  availableBrands = [],
  onFiltersChange,
  isOpen = true,
}: FilterSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(isOpen)
  const searchParams = useSearchParams()

  // Count active filters
  const activeFilterCount = [
    searchParams.get('brands'),
    searchParams.get('trust_score_min'),
    searchParams.get('price_min'),
    searchParams.get('price_max'),
  ].filter(Boolean).length

  const handleClearAll = () => {
    const params = new URLSearchParams()
    // Keep search query if present
    if (searchParams.get('q')) {
      params.set('q', searchParams.get('q')!)
    }
    window.location.href = `?${params.toString()}`
  }

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden w-full mb-4 px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm font-medium text-gray-700"
      >
        {mobileOpen ? '✕ Close Filters' : '☰ Show Filters'} {activeFilterCount > 0 && `(${activeFilterCount})`}
      </button>

      {/* Sidebar */}
      <div
        className={`${
          mobileOpen ? 'block' : 'hidden'
        } md:block bg-white border border-gray-200 rounded-lg p-6 md:w-64 md:sticky md:top-4`}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900">Filters</h2>
          {activeFilterCount > 0 && (
            <button
              onClick={handleClearAll}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Active Filters Display */}
        {activeFilterCount > 0 && (
          <div className="mb-4 p-2 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700 font-medium">{activeFilterCount} active filter{activeFilterCount !== 1 ? 's' : ''}</p>
          </div>
        )}

        <div className="border-t border-gray-200 pt-4">
          {/* Sort */}
          <SortDropdown currentSort={searchParams.get('sort') || 'trust_score_desc'} />

          {/* Rating */}
          <RatingFilter />

          {/* Brands */}
          {availableBrands.length > 0 && (
            <>
              <div className="border-t border-gray-200 my-4" />
              <BrandFilter availableBrands={availableBrands} />
            </>
          )}

          {/* Price Range */}
          <div className="border-t border-gray-200 my-4" />
          <PriceRangeSlider />
        </div>
      </div>
    </>
  )
}
