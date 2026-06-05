'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface SortDropdownProps {
  currentSort?: string
}

export default function SortDropdown({ currentSort = 'trust_score_desc' }: SortDropdownProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams)
    params.set('sort', e.target.value)
    params.set('offset', '0') // Reset to first page
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
      <select
        value={currentSort}
        onChange={handleSortChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
      >
        <option value="trust_score_desc">Highest Trust Score</option>
        <option value="trust_score_asc">Lowest Trust Score</option>
        <option value="name_asc">Name (A-Z)</option>
        <option value="name_desc">Name (Z-A)</option>
        <option value="newest">Newest First</option>
      </select>
    </div>
  )
}
