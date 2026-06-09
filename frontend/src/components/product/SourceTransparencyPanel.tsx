'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface SourcePanelProps {
  youtubeCount: number
  amazonCount: number
  authScoreAvg: number
  excludedCount: number
  lastRefreshed?: string
}

export default function SourceTransparencyPanel({
  youtubeCount,
  amazonCount,
  authScoreAvg,
  excludedCount,
  lastRefreshed,
}: SourcePanelProps) {
  const [expanded, setExpanded] = useState(false)

  const totalReviews = youtubeCount + amazonCount + excludedCount
  const authColor = authScoreAvg >= 70 ? '#10b981' : authScoreAvg >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <div style={{ marginBottom: '24px' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          padding: '12px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '6px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '13px',
          fontWeight: '600',
          color: 'var(--text-primary)',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
        }}
      >
        <span>📊 Source Transparency</span>
        <ChevronDown
          size={16}
          style={{
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        />
      </button>

      {expanded && (
        <div
          style={{
            marginTop: '8px',
            padding: '16px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '6px',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px',
          }}
        >
          {/* Review counts */}
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>YouTube</div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#ff0000' }}>
              {youtubeCount}
              <span style={{ fontSize: '12px', fontWeight: '400', color: 'var(--text-secondary)', marginLeft: '4px' }}>
                reviews
              </span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Amazon</div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#ff9900' }}>
              {amazonCount}
              <span style={{ fontSize: '12px', fontWeight: '400', color: 'var(--text-secondary)', marginLeft: '4px' }}>
                reviews
              </span>
            </div>
          </div>

          {/* Auth score */}
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Avg Auth Score</div>
            <div
              style={{
                fontSize: '18px',
                fontWeight: '700',
                color: authColor,
              }}
            >
              {authScoreAvg.toFixed(0)}
              <span style={{ fontSize: '12px', fontWeight: '400', color: 'var(--text-secondary)', marginLeft: '4px' }}>
                / 100
              </span>
            </div>
          </div>

          {/* Excluded */}
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Excluded</div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#6366f1' }}>
              {excludedCount}
              <span style={{ fontSize: '12px', fontWeight: '400', color: 'var(--text-secondary)', marginLeft: '4px' }}>
                noise/spam
              </span>
            </div>
          </div>

          {/* Trust formula */}
          <div style={{ gridColumn: '1 / -1', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Trust Score Formula</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              <div>Amazon <span style={{ color: 'var(--accent)' }}>45%</span> + YouTube <span style={{ color: 'var(--accent)' }}>35%</span> + Auth Score <span style={{ color: 'var(--accent)' }}>20%</span></div>
              <div style={{ marginTop: '8px', fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>
                {lastRefreshed && `Last refreshed: ${new Date(lastRefreshed).toLocaleDateString()}`}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
