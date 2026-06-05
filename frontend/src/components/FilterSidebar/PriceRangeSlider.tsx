'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

interface PriceRangeSliderProps {
  minValue?: number
  maxValue?: number
}

export default function PriceRangeSlider({ minValue = 0, maxValue = 100000 }: PriceRangeSliderProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [min, setMin] = useState(minValue)
  const [max, setMax] = useState(maxValue)

  const handleApply = () => {
    const params = new URLSearchParams(searchParams)
    params.set('price_min', min.toString())
    params.set('price_max', max.toString())
    params.set('offset', '0')
    router.push(`?${params.toString()}`)
  }

  const handleReset = () => {
    setMin(minValue)
    setMax(maxValue)
    const params = new URLSearchParams(searchParams)
    params.delete('price_min')
    params.delete('price_max')
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <label className="block text-sm font-semibold text-gray-700">Price Range</label>
        <button
          onClick={handleReset}
          className="text-xs text-blue-600 hover:text-blue-700"
        >
          Reset
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-600">Min: ₹{min.toLocaleString()}</label>
          <input
            type="range"
            min="0"
            max="100000"
            step="1000"
            value={min}
            onChange={(e) => setMin(parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="text-xs text-gray-600">Max: ₹{max.toLocaleString()}</label>
          <input
            type="range"
            min="0"
            max="100000"
            step="1000"
            value={max}
            onChange={(e) => setMax(parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        <button
          onClick={handleApply}
          className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          Apply
        </button>
      </div>
    </div>
  )
}
