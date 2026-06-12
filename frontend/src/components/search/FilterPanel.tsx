'use client'

import { useState, useCallback, useMemo } from 'react'
import { ChevronDown, X } from 'lucide-react'
import RangeSlider from './RangeSlider'
import CheckboxGroup from './CheckboxGroup'

interface FilterPanelProps {
  isOpen: boolean
  onClose: () => void
  onFiltersChange: (filters: SearchFiltersState) => void
  filters: SearchFiltersState
  stats?: FilterStats
}

export interface SearchFiltersState {
  trust_min: number
  trust_max: number
  auth_min: number
  source: 'all' | 'youtube' | 'amazon'
  confidence_tiers: string[]
}

export interface FilterStats {
  trust_score_range: [number, number]
  auth_score_range: [number, number]
  sources: { label: string; value: string; count: number }[]
  confidence_tiers: { label: string; value: string; count: number }[]
  total_products: number
}

export default function FilterPanel({
  isOpen,
  onClose,
  onFiltersChange,
  filters,
  stats,
}: FilterPanelProps) {
  const [localFilters, setLocalFilters] = useState<SearchFiltersState>(filters)
  const [expandedSections, setExpandedSections] = useState({
    trustScore: true,
    authenticity: true,
    source: true,
    confidence: false,
  })

  const handleTrustScoreChange = useCallback((min: number, max: number) => {
    const updated = { ...localFilters, trust_min: min, trust_max: max }
    setLocalFilters(updated)
    onFiltersChange(updated)
  }, [localFilters, onFiltersChange])

  const handleAuthScoreChange = useCallback((value: number) => {
    const updated = { ...localFilters, auth_min: value }
    setLocalFilters(updated)
    onFiltersChange(updated)
  }, [localFilters, onFiltersChange])

  const handleSourceChange = useCallback((value: 'all' | 'youtube' | 'amazon') => {
    const updated = { ...localFilters, source: value }
    setLocalFilters(updated)
    onFiltersChange(updated)
  }, [localFilters, onFiltersChange])

  const handleConfidenceTierChange = useCallback((tier: string) => {
    const updated = {
      ...localFilters,
      confidence_tiers: localFilters.confidence_tiers.includes(tier)
        ? localFilters.confidence_tiers.filter(t => t !== tier)
        : [...localFilters.confidence_tiers, tier],
    }
    setLocalFilters(updated)
    onFiltersChange(updated)
  }, [localFilters, onFiltersChange])

  const handleClearAll = useCallback(() => {
    const cleared: SearchFiltersState = {
      trust_min: 0,
      trust_max: 10,
      auth_min: 0,
      source: 'all',
      confidence_tiers: [],
    }
    setLocalFilters(cleared)
    onFiltersChange(cleared)
  }, [onFiltersChange])

  const hasActiveFilters = useMemo(() => {
    return (
      localFilters.trust_min > 0 ||
      localFilters.trust_max < 10 ||
      localFilters.auth_min > 0 ||
      localFilters.source !== 'all' ||
      localFilters.confidence_tiers.length > 0
    )
  }, [localFilters])

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 40,
            display: 'none',
          }}
          className="md:hidden"
        />
      )}

      {/* Filter Panel */}
      <div
        style={{
          position: 'fixed',
          right: 0,
          top: 0,
          height: '100vh',
          width: '100%',
          maxWidth: '360px',
          background: 'var(--bg)',
          borderLeft: '1px solid var(--border)',
          overflowY: 'auto',
          zIndex: 50,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform var(--transition-base)',
          display: 'none',
        }}
        className="md:relative md:display-block md:position-static md:width-360px md:height-auto md:border-left md:border-0 md:transform-none md:z-auto"
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px',
            borderBottom: '1px solid var(--border)',
            position: 'sticky',
            top: 0,
            background: 'var(--bg)',
            zIndex: 10,
          }}
        >
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            Filters
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'none',
            }}
            className="md:hidden"
          >
            <X size={24} color="var(--text-primary)" />
          </button>
        </div>

        {/* Filter Content */}
        <div style={{ padding: '20px' }}>
          {/* Trust Score */}
          <FilterSection
            title="TrustScore"
            isExpanded={expandedSections.trustScore}
            onToggle={() =>
              setExpandedSections(prev => ({
                ...prev,
                trustScore: !prev.trustScore,
              }))
            }
          >
            <RangeSlider
              min={0}
              max={10}
              step={0.1}
              value={[localFilters.trust_min, localFilters.trust_max]}
              onChange={handleTrustScoreChange}
              labels={['0', '10']}
            />
            <div
              style={{
                display: 'flex',
                gap: '8px',
                marginTop: '12px',
                fontSize: '12px',
              }}
            >
              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={localFilters.trust_min}
                onChange={(e) =>
                  handleTrustScoreChange(parseFloat(e.target.value), localFilters.trust_max)
                }
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  color: 'var(--text-primary)',
                }}
                placeholder="Min"
              />
              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={localFilters.trust_max}
                onChange={(e) =>
                  handleTrustScoreChange(localFilters.trust_min, parseFloat(e.target.value))
                }
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  color: 'var(--text-primary)',
                }}
                placeholder="Max"
              />
            </div>
          </FilterSection>

          {/* Authenticity Score */}
          <FilterSection
            title="Authenticity Score"
            isExpanded={expandedSections.authenticity}
            onToggle={() =>
              setExpandedSections(prev => ({
                ...prev,
                authenticity: !prev.authenticity,
              }))
            }
          >
            <RangeSlider
              min={0}
              max={100}
              step={5}
              value={[localFilters.auth_min]}
              onChange={(min) => handleAuthScoreChange(min)}
              labels={['0', '100']}
            />
            <div
              style={{
                marginTop: '12px',
                fontSize: '12px',
                color: 'var(--text-muted)',
              }}
            >
              Minimum: {localFilters.auth_min}/100
            </div>
          </FilterSection>

          {/* Source */}
          <FilterSection
            title="Data Source"
            isExpanded={expandedSections.source}
            onToggle={() =>
              setExpandedSections(prev => ({
                ...prev,
                source: !prev.source,
              }))
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { label: 'All Sources', value: 'all' },
                { label: '🎬 YouTube Only', value: 'youtube' },
                { label: '🛒 Amazon Only', value: 'amazon' },
              ].map(option => (
                <label
                  key={option.value}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  <input
                    type="radio"
                    name="source"
                    value={option.value}
                    checked={localFilters.source === option.value}
                    onChange={(e) =>
                      handleSourceChange(e.target.value as 'all' | 'youtube' | 'amazon')
                    }
                    style={{ cursor: 'pointer' }}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Confidence Tier */}
          <FilterSection
            title="Confidence Tier"
            isExpanded={expandedSections.confidence}
            onToggle={() =>
              setExpandedSections(prev => ({
                ...prev,
                confidence: !prev.confidence,
              }))
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { label: '🚀 Early', value: 'early' },
                { label: '📈 Growing', value: 'growing' },
                { label: '📊 Established', value: 'established' },
                { label: '✨ Mature', value: 'mature' },
              ].map(tier => (
                <label
                  key={tier.value}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={localFilters.confidence_tiers.includes(tier.value)}
                    onChange={() => handleConfidenceTierChange(tier.value)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span>{tier.label}</span>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={handleClearAll}
              style={{
                width: '100%',
                marginTop: '24px',
                padding: '10px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'var(--red)',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all var(--transition-base)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
              }}
            >
              Clear All Filters
            </button>
          )}
        </div>
      </div>
    </>
  )
}

function FilterSection({
  title,
  isExpanded,
  onToggle,
  children,
}: {
  title: string
  isExpanded: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: '20px', borderBottom: '1px solid var(--border)' }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          padding: '12px 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--text-primary)',
        }}
      >
        {title}
        <ChevronDown
          size={18}
          style={{
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform var(--transition-base)',
          }}
        />
      </button>
      {isExpanded && <div style={{ marginTop: '12px', marginBottom: '12px' }}>{children}</div>}
    </div>
  )
}
