'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import ConfidenceTierBadge from './ConfidenceTierBadge'
import ProductComparison from './ProductComparison'
import { calculateFeatureSimilarity } from '@/lib/comparison'

interface RelatedProduct {
  id: string
  name: string
  slug: string
  trust_score: number
  summary: string
  confidence_tier: string
  source_count_yt: number
  source_count_amz: number
  feature_scores: Record<string, number>
  spec_tags: Record<string, string>
  auth_score_avg: number
}

interface CurrentProduct extends RelatedProduct {
  category: string
}

interface RelatedProductsProps {
  locale: string
  productSlug: string
  category: string
}

export default function RelatedProducts({ locale, productSlug, category }: RelatedProductsProps) {
  const [current, setCurrent] = useState<CurrentProduct | null>(null)
  const [similar, setSimilar] = useState<RelatedProduct[]>([])
  const [alternatives, setAlternatives] = useState<RelatedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [compareProduct, setCompareProduct] = useState<RelatedProduct | null>(null)
  const [comparisonOpen, setComparisonOpen] = useState(false)

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          `https://trustlens-rqkd9.ondigitalocean.app/api/v1/products/${locale}/${productSlug}/related`
        )
        if (!response.ok) throw new Error('Failed to fetch related products')

        const data = await response.json()
        setCurrent({ ...data.current_product, category })
        setSimilar(data.similar_products || [])
        setAlternatives(data.better_alternatives || [])
      } catch (err) {
        console.error('Error fetching related products:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchRelated()
  }, [locale, productSlug, category])

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

  const handleCompare = (product: RelatedProduct) => {
    if (current) {
      setCompareProduct(product)
      setComparisonOpen(true)
    }
  }

  const ProductCard = ({
    product,
    isBetter,
  }: {
    product: RelatedProduct
    isBetter?: boolean
  }) => {
    const similarity = current ? calculateFeatureSimilarity(current.feature_scores, product.feature_scores) : 0

    return (
      <div
        style={{
          display: 'block',
          padding: '20px',
          background: 'var(--bg-secondary)',
          border: isBetter ? '2px solid var(--accent)' : '1px solid var(--border)',
          borderRadius: '8px',
          textDecoration: 'none',
          color: 'inherit',
          transition: 'all 0.2s ease',
          cursor: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 4px 0' }}>
              {product.name}
            </h3>
            <ConfidenceTierBadge tier={product.confidence_tier} />
          </div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: isBetter ? '#00ff00' : '#00d9ff', marginLeft: '10px' }}>
            {isBetter ? '⭐' : ''} {product.trust_score.toFixed(1)}
          </div>
        </div>

        {/* Similarity Score */}
        {!isBetter && (
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              background: `rgba(0, 217, 255, ${0.1 + similarity / 1000})`,
              color: '#00d9ff',
              padding: '4px 8px',
              borderRadius: '4px',
              marginBottom: '12px',
              display: 'inline-block',
            }}
          >
            {similarity}% Feature Match
          </div>
        )}

        {/* Summary */}
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '8px 0 12px 0', lineHeight: '1.4' }}>
          {product.summary.substring(0, 100)}...
        </p>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {product.source_count_yt + product.source_count_amz} reviews
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => handleCompare(product)}
              style={{
                fontSize: '12px',
                padding: '6px 12px',
                background: 'rgba(0, 217, 255, 0.1)',
                border: '1px solid rgba(0, 217, 255, 0.3)',
                borderRadius: '4px',
                color: '#00d9ff',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 217, 255, 0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 217, 255, 0.1)'
              }}
            >
              Compare
            </button>
            <Link
              href={`/${locale}/${category}/${product.slug}`}
              style={{
                fontSize: '12px',
                padding: '6px 12px',
                background: isBetter ? 'rgba(0, 255, 0, 0.1)' : 'rgba(0, 217, 255, 0.1)',
                border: isBetter ? '1px solid rgba(0, 255, 0, 0.3)' : '1px solid rgba(0, 217, 255, 0.3)',
                borderRadius: '4px',
                color: isBetter ? '#00ff00' : '#00d9ff',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isBetter ? 'rgba(0, 255, 0, 0.2)' : 'rgba(0, 217, 255, 0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isBetter ? 'rgba(0, 255, 0, 0.1)' : 'rgba(0, 217, 255, 0.1)'
              }}
            >
              {isBetter ? 'Upgrade' : 'View'} <ChevronRight size={12} />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div style={{ marginTop: '60px', paddingTop: '40px', borderTop: '1px solid var(--border)' }}>
        {/* Similar Products */}
        {similar.length > 0 && (
          <div style={{ marginBottom: '50px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px', color: 'var(--text-primary)' }}>
              Similar Products
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '20px',
              }}
            >
              {similar.map((product) => (
                <ProductCard key={product.id} product={product} />
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
                <ProductCard key={product.id} product={product} isBetter />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Comparison Modal */}
      {current && compareProduct && (
        <ProductComparison
          product1={current}
          product2={compareProduct}
          isOpen={comparisonOpen}
          onClose={() => setComparisonOpen(false)}
        />
      )}
    </>
  )
}
