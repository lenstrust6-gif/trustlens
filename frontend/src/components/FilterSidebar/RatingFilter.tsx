'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface RatingFilterProps {
  minScore?: number
  maxScore?: number
}

export default function RatingFilter({ minScore = 0, maxScore = 10 }: RatingFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleRatingFilter = (minValue: number) => {
    const params = new URLSearchParams(searchParams)
    if (minValue === 0) {
      params.delete('trust_score_min')
    } else {
      params.set('trust_score_min', minValue.toString())
    }
    params.set('offset', '0')
    router.push(`?${params.toString()}`)
  }

  const ratingOptions = [
    { label: 'All Ratings', value: 0 },
    { label: '★★★★★ 9.0+', value: 9.0 },
    { label: '★★★★☆ 8.0+', value: 8.0 },
    { label: '★★★☆☆ 7.0+', value: 7.0 },
    { label: '★★☆☆☆ 6.0+', value: 6.0 },
  ]

  const currentMin = parseFloat(searchParams.get('trust_score_min') || '0')

  return (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-gray-700 mb-2">Trust Score</label>
      <div className="space-y-2">
        {ratingOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handleRatingFilter(option.value)}
            className={`w-full text-left px-3 py-2 rounded-lg border transition ${
              currentMin === option.value
                ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium'
                : 'border-gray-300 text-gray-700 hover:border-gray-400'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
