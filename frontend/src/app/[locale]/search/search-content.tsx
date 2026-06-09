'use client'
export const dynamic = 'force-dynamic'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { api } from '@/lib/api'
import { VerdictCard as VerdictCardType } from '@/lib/types'
import FilterPanel, { SearchFiltersState } from '@/components/search/FilterPanel'
import FilterChips from '@/components/search/FilterChips'
import SearchResults from './search-results'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Filter, X } from 'lucide-react'

interface SearchContentProps {
  locale: string
}

export default function SearchContent({ locale }: SearchContentProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get('q') || ''

  const [results, setResults] = useState<VerdictCardType[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filterPanelOpen, setFilterPanelOpen] = useState(false)
  const [filterStats, setFilterStats] = useState<any>(null)

  // Parse filters from URL
  const filters = useMemo<SearchFiltersState>(() => {
    return {
      trust_min: parseFloat(searchParams.get('trust_min') || '0'),
      trust_max: parseFloat(searchParams.get('trust_max') || '10'),
      auth_min: parseInt(searchParams.get('auth_min') || '0'),
      source: (searchParams.get('source') || 'all') as 'all' | 'youtube' | 'amazon',
      confidence_tiers: (searchParams.get('confidence_tiers') || '')
        .split(',')
        .filter(t => t.trim()),
    }
  }, [searchParams])

  // Build query params from filters
  const getFilterParams = useCallback((f: SearchFiltersState) => {
    const params = new URLSearchParams()
    params.set('q', query)
    if (f.trust_min > 0) params.set('trust_min', f.trust_min.toString())
    if (f.trust_max < 10) params.set('trust_max', f.trust_max.toString())
    if (f.auth_min > 0) params.set('auth_min', f.auth_min.toString())
    if (f.source !== 'all') params.set('source', f.source)
    if (f.confidence_tiers.length > 0) params.set('confidence_tiers', f.confidence_tiers.join(','))
    return params.toString()
  }, [query])

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: SearchFiltersState) => {
    const params = getFilterParams(newFilters)
    router.push(`/${locale}/search?${params}`)
  }, [router, locale, getFilterParams])

  // Handle filter removal
  const handleRemoveFilter = useCallback((filterType: keyof SearchFiltersState, value?: string) => {
    const newFilters = { ...filters }

    if (filterType === 'trust_min') {
      newFilters.trust_min = 0
    } else if (filterType === 'trust_max') {
      newFilters.trust_max = 10
    } else if (filterType === 'auth_min') {
      newFilters.auth_min = 0
    } else if (filterType === 'source') {
      newFilters.source = 'all'
    } else if (filterType === 'confidence_tiers' && value) {
      newFilters.confidence_tiers = newFilters.confidence_tiers.filter(t => t !== value)
    }

    handleFiltersChange(newFilters)
  }, [filters, handleFiltersChange])

  // Handle clear all
  const handleClearAllFilters = useCallback(() => {
    const clearedFilters: SearchFiltersState = {
      trust_min: 0,
      trust_max: 10,
      auth_min: 0,
      source: 'all',
      confidence_tiers: [],
    }
    handleFiltersChange(clearedFilters)
  }, [handleFiltersChange])

  // Fetch results with filters
  useEffect(() => {
    if (!query) {
      setResults([])
      return
    }

    setLoading(true)
    setError(null)

    api
      .search(query, locale, filters)
      .then((data) => {
        console.log('[SearchContent] API Response:', data)
        console.log('[SearchContent] Results:', data.results)
        console.log('[SearchContent] Results Type:', typeof data.results, 'Is Array:', Array.isArray(data.results))
        setResults(data.results || [])
        if (!data.results || data.results.length === 0) {
          setError('No products found matching your criteria')
        } else {
          setError(null)
        }
      })
      .catch((err) => {
        console.error('[SearchContent] Error:', err)
        setError('Search failed. Try again.')
        setResults([])
      })
      .finally(() => {
        setLoading(false)
      })
  }, [query, locale, filters])

  // Fetch filter stats on mount
  useEffect(() => {
    api.getFilterStats(locale).then(setFilterStats).catch((err) => {
      console.error('Failed to fetch filter stats:', err)
    })
  }, [locale])

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--text-primary)',
        paddingTop: '60px',
        paddingBottom: '60px',
      }}
    >
      <div
        style={{
          maxWidth: '960px',
          margin: '0 auto',
          padding: '0 40px',
          width: '100%',
        }}
      >
        {/* Main Content */}
        <ErrorBoundary
          fallback={(error) => (
            <div style={{ padding: '20px', color: '#ff6b6b', background: 'rgba(255,107,107,0.1)', borderRadius: '8px' }}>
              <h3>Error rendering search page: {error?.message}</h3>
              <button onClick={() => window.location.reload()} style={{ padding: '8px 16px', background: '#ff6b6b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' }}>Reload</button>
            </div>
          )}
        >
        <div style={{ width: '100%' }}>
          {/* Search Bar with Filter Button */}
          <div style={{ marginBottom: '32px', display: 'flex', gap: '12px' }}>
            <input
              type="text"
              placeholder="Search products..."
              defaultValue={query}
              onChange={(e) => {
                const value = e.target.value
                if (value.trim()) {
                  router.push(`/${locale}/search?q=${encodeURIComponent(value)}`)
                }
              }}
              style={{
                flex: 1,
                padding: '16px 20px',
                fontSize: '16px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)',
                transition: 'all var(--transition-fast)',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.5)'
                e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-glow)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            />

            {/* Mobile Filter Button */}
            <button
              onClick={() => setFilterPanelOpen(!filterPanelOpen)}
              style={{
                padding: '16px 20px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: 600,
                transition: 'all var(--transition-fast)',
              }}
              className="md:hidden"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
              }}
            >
              <Filter size={20} />
              Filters
            </button>
          </div>

          {/* Mobile Filter Panel */}
          {filterPanelOpen && (
            <div className="md:hidden">
              <FilterPanel
                isOpen={filterPanelOpen}
                onClose={() => setFilterPanelOpen(false)}
                onFiltersChange={handleFiltersChange}
                filters={filters}
                stats={filterStats}
              />
            </div>
          )}

          {/* Filter Chips */}
          <FilterChips
            filters={filters}
            onRemoveFilter={handleRemoveFilter}
            onClearAll={handleClearAllFilters}
          />

          {/* Search Results */}
          <ErrorBoundary
            fallback={(error) => (
              <div style={{ padding: '20px', color: '#ff6b6b', background: 'rgba(255,107,107,0.1)', borderRadius: '8px' }}>
                <h3>Error rendering search results</h3>
                <p>{error?.message}</p>
                <button
                  onClick={() => window.location.reload()}
                  style={{
                    padding: '8px 16px',
                    background: '#ff6b6b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginTop: '10px',
                  }}
                >
                  Reload Page
                </button>
              </div>
            )}
          >
            <SearchResults results={results} loading={loading} error={error} />
          </ErrorBoundary>
        </div>
        </ErrorBoundary>
      </div>
    </div>
  )
}
