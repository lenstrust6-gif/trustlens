'use client'

import { VerdictCard as VerdictCardType } from '@/lib/types'
import VerdictCard from '@/components/VerdictCard'

interface SearchResultsProps {
  results: VerdictCardType[]
  loading: boolean
  error: string | null
}

export default function SearchResults({ results, loading, error }: SearchResultsProps) {
  console.log('[SearchResults] Render with props:', { results, loading, error })
  console.log('[SearchResults] Results type:', typeof results, 'Is array:', Array.isArray(results))

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)', fontSize: '16px' }}>
        Searching...
      </div>
    )
  }

  if (error) {
    return (
      <div
        style={{
          padding: '24px',
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          color: 'var(--red)',
        }}
      >
        <p style={{ fontWeight: 600, marginBottom: '8px' }}>{error}</p>
      </div>
    )
  }

  // Safely handle results
  const safeResults = Array.isArray(results) ? results : []
  console.log('[SearchResults] Safe results count:', safeResults.length)

  if (!safeResults || safeResults.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
        <p>No products found. Try adjusting your filters.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '48px' }}>
      {safeResults.map((verdict) => {
        try {
          return (
            <div key={verdict?.product?.slug || Math.random()}>
              <VerdictCard card={verdict} />
            </div>
          )
        } catch (err) {
          console.error('[SearchResults] Error rendering verdict:', verdict, err)
          return (
            <div key={Math.random()} style={{ color: 'red', padding: '20px' }}>
              Error rendering result
            </div>
          )
        }
      })}
    </div>
  )
}
