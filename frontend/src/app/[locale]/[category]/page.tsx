'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function CategoryPage({
  params,
}: {
  params: {
    locale: string
    category: string
  }
}) {
  const router = useRouter()
  const [search, setSearch] = useState('')

  const categoryName = params.category.replace(/-/g, ' ').toUpperCase()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) {
      router.push(`/${params.locale}/search?q=${encodeURIComponent(search)}`)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-2">{categoryName}</h1>
      <p className="text-gray-600 mb-12">Find the best {categoryName.toLowerCase()} with authentic reviews</p>

      {/* Tier 1: Quick Picks */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6">Quick Picks</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['Best Overall', 'Best Budget', 'Best Premium'].map((label) => (
            <div key={label} className="border-2 border-gray-200 rounded-lg p-6 hover:shadow-lg transition">
              <h3 className="font-semibold text-lg mb-2">{label}</h3>
              <p className="text-gray-600 text-sm mb-4">Loading product...</p>
              <div className="h-8 bg-gray-200 rounded-full" />
            </div>
          ))}
        </div>
      </section>

      {/* Tier 2: Ranked List */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6">All Products</h2>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-gray-600">Loading products...</p>
        </div>
      </section>

      {/* Tier 3: On-Demand Search */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Can't Find What You're Looking For?</h2>
        <form onSubmit={handleSearch} className="max-w-xl">
          <input
            type="text"
            placeholder="Search any product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-6 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="mt-4 px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
          >
            Search
          </button>
        </form>
      </section>
    </div>
  )
}
