'use client'

import { use, useState, useEffect } from 'react'
import Link from 'next/link'

interface Category {
  name: string
  slug: string
  product_count: number
}

interface Product {
  id: string
  name: string
  slug: string
  brand: string
  category: string
}

const CATEGORY_LABELS: Record<string, string> = {
  'tws-earbuds': '🎧 TWS Earbuds',
  'smartwatches': '⌚ Smartwatches',
  'wireless-headphones': '🎧 Wireless Headphones',
  'bluetooth-speakers': '🔊 Bluetooth Speakers',
  'power-banks': '🔋 Power Banks',
  'smartphones': '📱 Smartphones',
  'laptops': '💻 Laptops',
  'cameras': '📷 Cameras',
  'smartbands': '⌚ Smart Bands',
  'tablets': '📱 Tablets',
}

export default function CategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = use(params)
  const [categories, setCategories] = useState<Category[]>([])
  const [quickPicks, setQuickPicks] = useState<Record<string, Product[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

        // Fetch categories
        const categoriesRes = await fetch(`${apiUrl}/api/v1/categories/${locale}`)
        const categoriesData = await categoriesRes.json()

        if (categoriesData.status === 'ok' && categoriesData.categories) {
          setCategories(categoriesData.categories)
        }

        // Fetch quick picks
        const quickPicksRes = await fetch(`${apiUrl}/api/v1/categories/${locale}/quick-picks`)
        const quickPicksData = await quickPicksRes.json()

        if (quickPicksData.status === 'ok' && quickPicksData.quick_picks) {
          setQuickPicks(quickPicksData.quick_picks)
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [locale])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text-primary)', padding: '60px 40px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '40px', fontWeight: 'bold', marginBottom: '20px' }}>Loading categories...</h1>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text-primary)', paddingTop: '60px', paddingBottom: '60px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 40px' }}>
        {/* Header */}
        <div style={{ marginBottom: '60px' }}>
          <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '12px' }}>Browse Categories</h1>
          <p style={{ fontSize: '18px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            {categories.length} categories • {categories.reduce((sum, cat) => sum + cat.product_count, 0)} products
          </p>
          <p style={{ fontSize: '16px', color: 'var(--text-muted)' }}>
            Find authentic reviews for any product category
          </p>
        </div>

        {/* Categories Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '24px',
            marginBottom: '60px',
          }}
        >
          {categories.map((category) => (
            <Link key={category.slug} href={`/${locale}/${category.slug}`}>
              <div
                style={{
                  padding: '32px 24px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                  e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.3)'
                  e.currentTarget.style.transform = 'translateY(-4px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                {/* Category Header */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px', lineHeight: 1 }}>
                    {CATEGORY_LABELS[category.slug]?.charAt(0) || '📦'}
                  </div>
                  <h2 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>
                    {CATEGORY_LABELS[category.slug]?.slice(2) || category.name}
                  </h2>
                  <div
                    style={{
                      fontSize: '14px',
                      color: 'var(--accent)',
                      fontWeight: '600',
                    }}
                  >
                    {category.product_count} products
                  </div>
                </div>

                {/* Quick Picks Preview */}
                {quickPicks[category.slug] && quickPicks[category.slug].length > 0 && (
                  <div style={{ marginBottom: '20px', flex: 1 }}>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Top Picks
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {quickPicks[category.slug].slice(0, 2).map((product) => (
                        <div
                          key={product.slug}
                          style={{
                            fontSize: '13px',
                            color: 'var(--text-secondary)',
                            paddingLeft: '8px',
                            borderLeft: '2px solid var(--accent)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {product.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CTA */}
                <div
                  style={{
                    padding: '12px 16px',
                    background: 'rgba(37, 99, 235, 0.1)',
                    border: '1px solid rgba(37, 99, 235, 0.2)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: 'var(--accent)',
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(37, 99, 235, 0.15)'
                    e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.4)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(37, 99, 235, 0.1)'
                    e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.2)'
                  }}
                >
                  Browse All →
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Call to Action Section */}
        <div
          style={{
            padding: '48px 40px',
            background: 'rgba(37, 99, 235, 0.08)',
            border: '1px solid rgba(37, 99, 235, 0.2)',
            borderRadius: '12px',
            textAlign: 'center',
          }}
        >
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '12px' }}>
            Don't see your product?
          </h2>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Submit it for review and get authentic feedback from real users
          </p>
          <Link href={`/${locale}/submit`}>
            <button
              style={{
                padding: '12px 32px',
                background: 'var(--accent)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)'
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(37, 99, 235, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              Submit Product
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
