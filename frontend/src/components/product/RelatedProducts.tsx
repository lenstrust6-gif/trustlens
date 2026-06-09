'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

interface RelatedProduct {
  id: string
  name: string
  slug: string
  trust_score: number
  summary: string
  confidence_tier: string
  source_count_yt: number
}

interface RelatedProductsProps {
  locale: string
  productSlug: string
  category: string
}

export default function RelatedProducts({ locale, productSlug, category }: RelatedProductsProps) {
  const [similar, setSimilar] = useState<RelatedProduct[]>([])
  const [alternatives, setAlternatives] = useState<RelatedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          `https://trustlens-rqkd9.ondigitalocean.app/api/v1/products/${locale}/${productSlug}/related`
        )
        if (!response.ok) throw new Error('Failed to fetch related products')

        const data = await response.json()
        setSimilar(data.similar_products || [])
        setAlternatives(data.better_alternatives || [])
      } catch (err) {
        console.error('Error fetching related products:', err)
        setError('Could not load related products')
      } finally {
        setLoading(false)
      }
    }

    fetchRelated()
  }, [locale, productSlug])

  if (loading) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Loading similar products...
      </div>
    )
  }

  if (!similar.length && !alternatives.length) {
    return null
  }

  return (
    <div style={{ marginTop: '60px', paddingTop: '40px', borderTop: '1px solid var(--border)' }}>
      {/* Similar Products */}
      {similar.length > 0 && (
        <div style={{ marginBottom: '50px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px', color: 'var(--text-primary)' }}>
            Similar Products in {category}
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
            }}
          >
            {similar.map((product) => (
              <Link
                key={product.id}
                href={`/${locale}/${category}/${product.slug}`}
                style={{
                  display: 'block',
                  padding: '20px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}
                onMouseOver={(e) => {
                  const elem = e.currentTarget
                  elem.style.borderColor = 'var(--accent)'
                  elem.style.transform = 'translateY(-2px)'
                }}
                onMouseOut={(e) => {
                  const elem = e.currentTarget
                  elem.style.borderColor = 'var(--border)'
                  elem.style.transform = 'translateY(0)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0, flex: 1 }}>
                    {product.name}
                  </h3>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#00d9ff', marginLeft: '10px' }}>
                    {product.trust_score.toFixed(1)}
                  </div>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 12px 0', lineHeight: '1.4' }}>
                  {product.summary.substring(0, 100)}...
                </p>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {product.source_count_yt} YouTube reviews
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Better Alternatives */}
      {alternatives.length > 0 && (
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px', color: 'var(--text-primary)' }}>
            Better Alternatives
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
            }}
          >
            {alternatives.map((product) => (
              <Link
                key={product.id}
                href={`/${locale}/${category}/${product.slug}`}
                style={{
                  display: 'block',
                  padding: '20px',
                  background: 'var(--bg-secondary)',
                  border: '2px solid var(--accent)',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}
                onMouseOver={(e) => {
                  const elem = e.currentTarget
                  elem.style.transform = 'translateY(-2px)'
                  elem.style.boxShadow = '0 4px 12px rgba(0, 217, 255, 0.2)'
                }}
                onMouseOut={(e) => {
                  const elem = e.currentTarget
                  elem.style.transform = 'translateY(0)'
                  elem.style.boxShadow = 'none'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0, flex: 1 }}>
                    {product.name}
                  </h3>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#00ff00', marginLeft: '10px' }}>
                    ⭐ {product.trust_score.toFixed(1)}
                  </div>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 12px 0', lineHeight: '1.4' }}>
                  {product.summary.substring(0, 100)}...
                </p>
                <div style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: '500' }}>
                  Upgrade to this product <ChevronRight size={12} style={{ display: 'inline', marginLeft: '4px' }} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
