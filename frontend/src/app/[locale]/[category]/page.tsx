'use client'
export const dynamic = 'force-dynamic'

import { use, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import SectionLabel from '@/components/shared/SectionLabel'

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
  const [loading, setLoading] = useState(true)
  const [productsLoading, setProductsLoading] = useState(true)

  const categoryName = category.replace(/-/g, ' ').toUpperCase()
  const categoryLabel = category.replace(/-/g, ' ')

  // Fetch quick picks
  useEffect(() => {
    const fetchQuickPicks = async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/v1/categories/${locale}/${category}/quick-picks`
        )
        const data = await res.json()

        if (data.status === 'ok' && data.quickPicks) {
          setQuickPicks({
            best_overall: data.quickPicks.best_overall || null,
            budget: data.quickPicks.budget || null,
            premium: data.quickPicks.premium || null,
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
        params.set('limit', '50')
        params.set('sort', 'trust_score_desc')

        const res = await fetch(`${API_URL}/api/v1/products/filter?${params.toString()}`)
        const data = await res.json()

        if (data.status === 'ok' && Array.isArray(data.products)) {
          setProducts(data.products)
        } else {
          setProducts([])
        }
      } catch (error) {
        console.error('Error fetching products:', error)
        setProducts([])
      } finally {
        setProductsLoading(false)
      }
    }

    fetchProducts()
  }, [locale, category])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) {
      router.push(`/${locale}/search?q=${encodeURIComponent(search)}`)
    }
  }

  return (
    <div
      style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '60px 32px',
        background: 'var(--bg)',
      }}
      className="px-5 sm:px-8"
    >
      {/* Page Header */}
      <h1
        style={{
          fontSize: '48px',
          fontWeight: 400,
          color: 'var(--text-primary)',
          marginBottom: '12px',
          fontFamily: 'var(--font-display)',
        }}
      >
        {categoryName}
      </h1>
      <p
        style={{
          fontSize: '18px',
          color: 'var(--text-secondary)',
          marginBottom: '40px',
        }}
      >
        Find the best {categoryLabel} with authentic reviews
      </p>

      {/* Tier 1: Quick Picks */}
      <section style={{ marginBottom: '48px' }}>
        <SectionLabel text="TOP PICKS" />
        <h2
          style={{
            fontSize: '36px',
            fontWeight: 400,
            color: 'var(--text-primary)',
            marginBottom: '24px',
            fontFamily: 'var(--font-display)',
          }}
        >
          Best products in this category
        </h2>

        {loading ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
            }}
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '20px',
                  animation: 'pulse 2s infinite',
                  opacity: 0.5,
                }}
              />
            ))}
          </div>
        ) : Object.values(quickPicks).some((p) => p) ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
            }}
          >
            {quickPicks.best_overall && (
              <a
                href={`/${locale}/${category}/${quickPicks.best_overall.slug}`}
                style={{
                  background: 'var(--surface-1)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '24px',
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all var(--transition-base)',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.borderColor = 'var(--accent)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.borderColor = 'var(--border)'
                }}
              >
                <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 600, marginBottom: '8px' }}>
                  ⭐ BEST OVERALL
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  {quickPicks.best_overall.name}
                </h3>
                <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--accent)' }}>
                  {quickPicks.best_overall.trustScore}/10
                </div>
              </a>
            )}
            {quickPicks.budget && (
              <a
                href={`/${locale}/${category}/${quickPicks.budget.slug}`}
                style={{
                  background: 'var(--surface-1)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '24px',
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all var(--transition-base)',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.borderColor = 'var(--accent)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.borderColor = 'var(--border)'
                }}
              >
                <span style={{ fontSize: '12px', color: 'var(--amber)', fontWeight: 600, marginBottom: '8px' }}>
                  💰 BUDGET
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  {quickPicks.budget.name}
                </h3>
                <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--amber)' }}>
                  {quickPicks.budget.trustScore}/10
                </div>
              </a>
            )}
            {quickPicks.premium && (
              <a
                href={`/${locale}/${category}/${quickPicks.premium.slug}`}
                style={{
                  background: 'var(--surface-1)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '24px',
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all var(--transition-base)',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.borderColor = 'var(--accent)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.borderColor = 'var(--border)'
                }}
              >
                <span style={{ fontSize: '12px', color: 'var(--green)', fontWeight: 600, marginBottom: '8px' }}>
                  👑 PREMIUM
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  {quickPicks.premium.name}
                </h3>
                <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--green)' }}>
                  {quickPicks.premium.trustScore}/10
                </div>
              </a>
            )}
          </div>
        ) : null}
      </section>

      {/* Tier 2: All Products */}
      <section style={{ marginBottom: '48px' }}>
        <h2
          style={{
            fontSize: '28px',
            fontWeight: 400,
            color: 'var(--text-primary)',
            marginBottom: '32px',
            fontFamily: 'var(--font-display)',
          }}
        >
          All Products
        </h2>

        {productsLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '16px',
                  animation: 'pulse 2s infinite',
                  opacity: 0.5,
                }}
              />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {products.map((product) => (
              <a
                key={product.id}
                href={`/${locale}/${category}/${product.slug}`}
                style={{
                  background: 'var(--surface-1)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '16px 20px',
                  textDecoration: 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all var(--transition-base)',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)'
                  e.currentTarget.style.background = 'rgba(37, 99, 235, 0.02)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.background = 'var(--surface-1)'
                }}
              >
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {product.name}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{product.brand}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent)', marginBottom: '4px' }}>
                    {product.trustScore}/10
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '4px 8px',
                      background: 'rgba(37, 99, 235, 0.10)',
                      color: 'var(--accent)',
                      borderRadius: '4px',
                      display: 'inline-block',
                    }}
                  >
                    {product.confidenceTier}
                  </span>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 0', fontSize: '16px' }}>
            No products found in this category
          </p>
        )}
      </section>

      {/* Tier 3: On-Demand Search */}
      <section>
        <h2
          style={{
            fontSize: '28px',
            fontWeight: 400,
            color: 'var(--text-primary)',
            marginBottom: '20px',
            fontFamily: 'var(--font-display)',
          }}
        >
          Can't Find What You're Looking For?
        </h2>
        <form
          onSubmit={handleSearch}
          style={{
            maxWidth: '500px',
          }}
        >
          <input
            type="text"
            placeholder="Search any product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '15px',
              color: 'var(--text-primary)',
              background: 'var(--surface-1)',
              boxSizing: 'border-box',
              transition: 'all var(--transition-base)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent)'
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.08)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          />
          <button
            type="submit"
            style={{
              marginTop: '12px',
              padding: '12px 28px',
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all var(--transition-base)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--accent-bright)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--accent)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            Search
          </button>
        </form>
      </section>
    </div>
  )
}
