'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

interface BrandFilterProps {
  availableBrands: string[]
}

export default function BrandFilter({ availableBrands = [] }: BrandFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const selectedBrands = searchParams.get('brands')?.split(',') || []
  const [selectedLocal, setSelectedLocal] = useState<string[]>(selectedBrands)

  const handleBrandToggle = (brand: string) => {
    const newSelected = selectedLocal.includes(brand)
      ? selectedLocal.filter((b) => b !== brand)
      : [...selectedLocal, brand]
    setSelectedLocal(newSelected)
  }

  const handleApply = () => {
    const params = new URLSearchParams(searchParams)
    if (selectedLocal.length > 0) {
      params.set('brands', selectedLocal.join(','))
    } else {
      params.delete('brands')
    }
    params.set('offset', '0')
    router.push(`?${params.toString()}`)
  }

  const handleReset = () => {
    setSelectedLocal([])
    const params = new URLSearchParams(searchParams)
    params.delete('brands')
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <label className="block text-sm font-semibold text-gray-700">Brand</label>
        {selectedLocal.length > 0 && (
          <button
            onClick={handleReset}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            Clear
          </button>
        )}
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
        {availableBrands.map((brand) => (
          <label key={brand} className="flex items-center">
            <input
              type="checkbox"
              checked={selectedLocal.includes(brand)}
              onChange={() => handleBrandToggle(brand)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700">{brand}</span>
          </label>
        ))}
      </div>

      <button
        onClick={handleApply}
        className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
      >
        Apply
      </button>
    </div>
  )
}
