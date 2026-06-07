'use client'

import { X } from 'lucide-react'
import { SearchFiltersState } from './FilterPanel'

interface FilterChipsProps {
  filters: SearchFiltersState
  onRemoveFilter: (filterType: keyof SearchFiltersState, value?: string) => void
  onClearAll: () => void
}

export default function FilterChips({
  filters,
  onRemoveFilter,
  onClearAll,
}: FilterChipsProps) {
  const chips: Array<{ label: string; type: keyof SearchFiltersState; value?: string }> = []

  // TrustScore
  if (filters.trust_min > 0 || filters.trust_max < 10) {
    chips.push({
      label: `TrustScore: ${filters.trust_min.toFixed(1)} - ${filters.trust_max.toFixed(1)}`,
      type: 'trust_min',
    })
  }

  // Authenticity Score
  if (filters.auth_min > 0) {
    chips.push({
      label: `Auth: ${filters.auth_min}+`,
      type: 'auth_min',
    })
  }

  // Source
  if (filters.source !== 'all') {
    chips.push({
      label: filters.source === 'youtube' ? '🎬 YouTube' : '🛒 Amazon',
      type: 'source',
    })
  }

  // Confidence Tiers
  filters.confidence_tiers.forEach(tier => {
    const tierLabel: Record<string, string> = {
      early: '🚀 Early',
      growing: '📈 Growing',
      established: '📊 Established',
      mature: '✨ Mature',
    }
    chips.push({
      label: tierLabel[tier] || tier,
      type: 'confidence_tiers',
      value: tier,
    })
  })

  if (chips.length === 0) {
    return null
  }

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        marginBottom: '20px',
        alignItems: 'center',
      }}
    >
      {chips.map((chip, idx) => (
        <div
          key={idx}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            background: 'rgba(37, 99, 235, 0.15)',
            border: '1px solid rgba(37, 99, 235, 0.3)',
            borderRadius: '20px',
            fontSize: '12px',
            color: 'var(--text-primary)',
          }}
        >
          {chip.label}
          <button
            onClick={() => onRemoveFilter(chip.type, chip.value)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              color: 'var(--text-muted)',
              transition: 'color var(--transition-base)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)'
            }}
          >
            <X size={14} />
          </button>
        </div>
      ))}

      <button
        onClick={onClearAll}
        style={{
          fontSize: '12px',
          color: 'var(--text-muted)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textDecoration: 'underline',
          transition: 'color var(--transition-base)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--text-primary)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--text-muted)'
        }}
      >
        Clear all
      </button>
    </div>
  )
}
