'use client'
export const dynamic = 'force-dynamic'

import { use, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import QuickPickCard from '@/components/QuickPickCard'
import FilterSidebar from '@/components/FilterSidebar'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface QuickPick {
  name: string
  slug: string
  category: string
  trustScore: number
  confidenceTier: string
}

interface Product {
  id: string
  name: string
  slug: string
  category: string
  brand: string
  trustScore: number
  confidenceTier: string
}

export default function CategoryPage({
  params,
}: {
  params: Promise<{
    locale: string
    category: string
  }>
}) {
  const { locale, category } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState('')

  const [quickPicks, setQuickPicks] = useState<Record<string, QuickPick | null>>({
    best_overall: null,
    budget: null,
    premium: null,
  })
  const [products, setProducts] = useState<Product[]>([])
  const [brands, setBrands] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [productsLoading, setProductsLoading] = useState(true)

  const categoryName = category.replace(/-/g, ' ').toUpperCase()

  // Fetch quick picks
  useEffect(() => {
    const fetchQuickPicks = async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/v1/categories/${locale}/${category}/quick-picks`
        )
        const data = await res.json()

        if (data.status === 'ok') {
          setQuickPicks({
            best_overall: data.quickPicks.best_overall,
            budget: data.quickPicks.budget,
            premium: data.quickPicks.premium,
          })
        }
      } catch (error) {
        console.error('Error fetching quick picks:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchQuickPicks()
  }, [locale, category])

  // Fetch products with filters
  useEffect(() => {
    const fetchProducts = async () => {
      setProductsLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('locale', locale)
        params.set('category', category)
        params.set('limit', '20')

        const sort = searchParams.get('sort') || 'trust_score_desc'
        params.set('sort', sort)

        const res = await fetch(`${API_URL}/api/v1/products/filter?${params.toString()}`)
        const data = await res.json()

        if (data.status === 'ok') {
          setProducts(data.products)
        }
      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        setProductsLoading(false)
      }
    }

    fetchProducts()
  }, [locale, category, searchParams])

  // Fetch brands
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/v1/products/brands?locale=${locale}&category=${category}`
        )
        const data = await res.json()

        if (data.status === 'ok') {
          setBrands(data.brands)
        }
      } catch (error) {
        console.error('Error fetching brands:', error)
      }
    }

    fetchBrands()
  }, [locale, category])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) {
      router.push(`/${locale}/search?q=${encodeURIComponent(search)}`)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-2">{categoryName}</h1>
      <p className="text-gray-600 mb-12">Find the best {categoryName.toLowerCase()} with authentic reviews</p>

      {/* Tier 1: Quick Picks */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6">Quick Picks</h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-2 border-gray-200 rounded-lg p-6 bg-gray-50 animate-pulse">
                <div className="h-4 bg-gray-300 rounded mb-4 w-24" />
                <div className="h-6 bg-gray-300 rounded mb-4" />
                <div className="h-8 bg-gray-300 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickPicks.best_overall && (
              <QuickPickCard
                {...quickPicks.best_overall}
                label="Best Overall"
                category={category}
              />
            )}
            {quickPicks.budget && (
              <QuickPickCard
                {...quickPicks.budget}
                label="Budget"
                category={category}
              />
            )}
            {quickPicks.premium && (
              <QuickPickCard
                {...quickPicks.premium}
                label="Premium"
                category={category}
              />
            )}
          </div>
        )}
      </section>

      {/* Tier 2: Ranked List with Filters */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6">All Products</h2>
        <div className="flex gap-6">
          {/* Filter Sidebar */}
          <FilterSidebar availableBrands={brands} />

          {/* Product List */}
          <div className="flex-1">
            {productsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-4 bg-gray-50 animate-pulse">
                    <div className="h-4 bg-gray-300 rounded mb-2 w-1/2" />
                    <div className="h-4 bg-gray-300 rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="space-y-4">
                {products.map((product) => (
                  <a
                    key={product.id}
                    href={`/${locale}/${category}/${product.slug}`}
                    className="block border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">{product.name}</h3>
                        <p className="text-sm text-gray-600">{product.brand}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">{product.trustScore}</div>
                        <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded">
                          {product.confidenceTier}
                        </span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-600 py-8">No products found</p>
            )}
          </div>
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
