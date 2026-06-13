'use client'

import { useState, useEffect } from 'react'
import SectionLabel from '../shared/SectionLabel'
import Card from '../shared/Card'
import TabGroup from '../shared/TabGroup'

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

interface CategoryBrowseProps {
  locale: string
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

export default function CategoryBrowse({ locale }: CategoryBrowseProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [quickPicks, setQuickPicks] = useState<Record<string, Product[]>>({})
  const [activeCategory, setActiveCategory] = useState<string>('')
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
          setActiveCategory(categoriesData.categories[0]?.slug || '')
        }

        // Fetch quick picks for all categories
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

  const tabs = categories.map((cat) => ({
    id: cat.slug,
    label: CATEGORY_LABELS[cat.slug] || cat.name,
  }))

  const currentPicks = quickPicks[activeCategory] || []

  const getProductCount = () => {
    return categories.find(c => c.slug === activeCategory)?.product_count || 0
  }

  if (loading) {
    return (
      <section
        id="categories"
        style={{
          padding: '60px 40px',
          background: 'var(--bg)',
          borderTop: '1px solid var(--border)',
        }}
      >
        <div className="container" style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <SectionLabel text="BROWSE BY CATEGORY" />
          <h2 style={{ marginBottom: '40px', color: 'var(--text-primary)' }}>Loading categories...</h2>
        </div>
      </section>
    )
  }

  return (
    <section
      id="categories"
      style={{
        padding: '36px 40px 48px',
        background: 'var(--bg)',
        borderTop: '1px solid var(--border)',
      }}
      className="px-5 sm:px-8"
    >
      <div className="container" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Section Label + Title */}
        <SectionLabel text={`BROWSE ${categories.length} CATEGORIES`} />
        <h2 style={{ marginBottom: '40px', color: 'var(--text-primary)' }}>
          Top products across all categories.
        </h2>

        {/* Tab Group */}
        {tabs.length > 0 && (
          <TabGroup
            tabs={tabs}
            activeTab={activeCategory}
            onTabChange={setActiveCategory}
          />
        )}

        {/* Quick Pick Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          {currentPicks.length > 0 ? (
            currentPicks.map((product, idx) => (
              <Card
                key={product.slug}
                featured={idx === 0}
                href={`/${locale}/${product.category}/${product.slug}`}
                style={{
                  opacity: 1,
                  transform: 'translateY(0)',
                  transition: `all 0.5s ease ${idx * 100}ms`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '24px',
                      lineHeight: 1,
                    }}
                  >
                    {idx === 0 && '🏆'}
                    {idx === 1 && '💰'}
                    {idx === 2 && '✨'}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      padding: '4px 12px',
                      background:
                        idx === 0
                          ? 'rgba(245, 158, 11, 0.12)'
                          : idx === 1
                            ? 'rgba(16, 185, 129, 0.12)'
                            : 'rgba(37, 99, 235, 0.12)',
                      border: `1px solid ${
                        idx === 0
                          ? 'rgba(245, 158, 11, 0.3)'
                          : idx === 1
                            ? 'rgba(16, 185, 129, 0.3)'
                            : 'rgba(37, 99, 235, 0.3)'
                      }`,
                      borderRadius: '4px',
                      color:
                        idx === 0
                          ? 'var(--amber)'
                          : idx === 1
                            ? 'var(--green)'
                            : 'var(--accent)',
                      fontWeight: 600,
                    }}
                  >
                    {idx === 0 ? 'Best Overall' : idx === 1 ? 'Best Budget' : 'Premium Pick'}
                  </div>
                </div>

                <h3
                  style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    marginBottom: '12px',
                    color: 'var(--text-primary)',
                  }}
                >
                  {product.name}
                </h3>

                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    marginBottom: '16px',
                    minHeight: '36px',
                    lineHeight: '1.5',
                  }}
                >
                  {product.brand} • Trusted by Indian users
                </p>

                <div
                  style={{
                    marginTop: '12px',
                    fontSize: '11px',
                    color: 'var(--green)',
                    fontWeight: 600,
                  }}
                >
                  ✓ In Database
                </div>
              </Card>
            ))
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>No products found for this category</p>
          )}
        </div>

        {/* View All Link */}
        {activeCategory && (
          <div style={{ textAlign: 'center' }}>
            <a
              href={`/${locale}/${activeCategory}`}
              style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                transition: 'color var(--transition-base)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--accent)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)'
              }}
            >
              View all {getProductCount()} products in {CATEGORY_LABELS[activeCategory] || activeCategory} →
            </a>
          </div>
        )}
      </div>
    </section>
  )
}
