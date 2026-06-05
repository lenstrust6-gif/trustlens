'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addRecentSearch } from '@/lib/localStorage'

export default function HomePage({ params }: { params: { locale: string } }) {
  const router = useRouter()
  const [search, setSearch] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!search.trim()) return

    addRecentSearch(search)
    router.push(`/${params.locale}/search?q=${encodeURIComponent(search)}`)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-2 text-4xl">🇮🇳</div>
        <h1 className="text-5xl font-bold mb-4">TrustLens</h1>
        <p className="text-xl text-gray-600 mb-12">India's product review intelligence portal</p>

        <form onSubmit={handleSearch} className="mb-8">
          <input
            type="text"
            placeholder="Search any product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-6 py-3 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="mt-4 px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
          >
            Search
          </button>
        </form>

        <div className="text-left">
          <p className="text-sm font-semibold text-gray-500 mb-3">Quick Picks</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {['boAt Airdopes 141', 'Noise ColorFit Pro 4', 'Mi Power Bank 3i'].map((product) => (
              <button
                key={product}
                onClick={() => {
                  setSearch(product)
                  addRecentSearch(product)
                  router.push(`/${params.locale}/search?q=${encodeURIComponent(product)}`)
                }}
                className="p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-left"
              >
                <p className="font-medium text-gray-900">{product}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
