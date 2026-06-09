interface ReviewHighlight {
  id?: string
  source: 'youtube' | 'amazon'
  text: string
  authScore: number
  helpfulCount?: number
}

interface ReviewHighlightsProps {
  highlights?: ReviewHighlight[] | null
}

export default function ReviewHighlights({ highlights }: ReviewHighlightsProps) {
  if (!highlights || !Array.isArray(highlights) || highlights.length === 0) {
    return null
  }

  const displayHighlights = highlights.slice(0, 3)

  return (
    <div style={{ marginBottom: '24px' }}>
      <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>
        Customer Highlights
      </h3>
      <div style={{ display: 'grid', gap: '12px' }}>
        {displayHighlights.map((highlight, idx) => {
          const authColor = highlight.authScore >= 80 ? '#10b981' : highlight.authScore >= 60 ? '#f59e0b' : '#ef4444'
          const sourceBadge = highlight.source === 'youtube' ? '▶️ YouTube' : '🛒 Amazon'

          return (
            <div
              key={highlight.id || idx}
              style={{
                padding: '12px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '6px',
                fontSize: '13px',
                lineHeight: '1.5',
                color: 'var(--text-secondary)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{sourceBadge}</span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    background: `${authColor}20`,
                    border: `1px solid ${authColor}40`,
                    padding: '2px 6px',
                    borderRadius: '3px',
                    color: authColor,
                  }}
                >
                  Auth: {highlight.authScore}%
                </span>
              </div>
              <p style={{ margin: '0', color: 'var(--text-primary)' }}>"{highlight.text}"</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
