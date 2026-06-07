'use client'

import { useState } from 'react'
import SectionLabel from '../shared/SectionLabel'
import Card from '../shared/Card'
import TabGroup from '../shared/TabGroup'
import { CATEGORIES } from '@/lib/home-data'

interface CategoryBrowseProps {
  locale: string
}

export default function CategoryBrowse({ locale }: CategoryBrowseProps) {
  const [activeCategory, setActiveCategory] = useState('earbuds')

  const tabs = Object.entries(CATEGORIES).map(([key, value]) => ({
    id: key,
    label: value.label,
  }))

  const currentPicks = CATEGORIES[activeCategory as keyof typeof CATEGORIES].picks

  const getBadgeColor = (badge: string) => {
    if (badge.includes('Overall')) return 'amber'
    if (badge.includes('Budget')) return 'green'
    return 'blue'
  }

  return (
    <section
      id="categories"
      style={{
        padding: '60px 40px',
        background: 'var(--bg)',
        borderTop: '1px solid var(--border)',
      }}
      className="px-5 sm:px-8"
    >
      <div className="container" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Section Label + Title */}
        <SectionLabel text="BROWSE BY CATEGORY" />
        <h2 style={{ marginBottom: '40px' }}>
          Top picks across India's most-searched categories.
        </h2>

        {/* Tab Group */}
        <TabGroup
          tabs={tabs}
          activeTab={activeCategory}
          onTabChange={setActiveCategory}
        />

        {/* Quick Pick Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          {currentPicks.map((pick, idx) => {
            const isFeatured = pick.badge.includes('Overall')
            const badgeColor = getBadgeColor(pick.badge)

            return (
              <Card
                key={pick.name}
                featured={isFeatured}
                href={`/${locale}/products/${pick.slug}`}
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
                    {pick.badge.includes('Overall') && '🏆'}
                    {pick.badge.includes('Budget') && '💰'}
                    {pick.badge.includes('Premium') && '✨'}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      padding: '4px 12px',
                      background:
                        badgeColor === 'amber'
                          ? 'rgba(245, 158, 11, 0.12)'
                          : badgeColor === 'green'
                            ? 'rgba(16, 185, 129, 0.12)'
                            : 'rgba(37, 99, 235, 0.12)',
                      border: `1px solid ${
                        badgeColor === 'amber'
                          ? 'rgba(245, 158, 11, 0.3)'
                          : badgeColor === 'green'
                            ? 'rgba(16, 185, 129, 0.3)'
                            : 'rgba(37, 99, 235, 0.3)'
                      }`,
                      borderRadius: '4px',
                      color:
                        badgeColor === 'amber'
                          ? 'var(--amber)'
                          : badgeColor === 'green'
                            ? 'var(--green)'
                            : 'var(--accent)',
                      fontWeight: 600,
                    }}
                  >
                    {pick.badge}
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
                  {pick.name}
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
                  Trusted by thousands of Indian users across all categories.
                </p>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '8px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '26px',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--accent)',
                      fontWeight: 600,
                    }}
                  >
                    {pick.score}
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                    /10
                  </div>
                </div>

                <div
                  style={{
                    marginTop: '12px',
                    fontSize: '11px',
                    color: 'var(--green)',
                    fontWeight: 600,
                  }}
                >
                  ✓ Recommended
                </div>
              </Card>
            )
          })}
        </div>

        {/* View All Link */}
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
            View all 12 {CATEGORIES[activeCategory as keyof typeof CATEGORIES].label.split(' ')[1]} →
          </a>
        </div>
      </div>
    </section>
  )
}
