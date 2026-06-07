interface TrustScoreProps {
  score: number
  tier: 'early' | 'growing' | 'established' | 'mature'
}

const TIER_LABELS: Record<string, string> = {
  early: '🚀 Early',
  growing: '📈 Growing',
  established: '📊 Established',
  mature: '✨ Mature',
}

export default function TrustScore({ score, tier }: TrustScoreProps) {
  const percentage = (score / 10) * 100

  return (
    <div
      style={{
        padding: '28px',
        background: '#0A0D12',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '10px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '32px',
      }}
    >
      {/* Score Block */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Score Number */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '4px',
          }}
        >
          <span
            style={{
              fontSize: '52px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              color: 'var(--accent)',
            }}
          >
            {score.toFixed(1)}
          </span>
          <span
            style={{
              fontSize: '14px',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            /10 TrustScore
          </span>
        </div>

        {/* Progress Bar */}
        <div
          style={{
            width: '200px',
            height: '4px',
            background: 'rgba(255,255,255,0.08)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${percentage}%`,
              background: 'var(--accent)',
              borderRadius: '2px',
            }}
          />
        </div>

        {/* Badges Row */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {/* Recommendation Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '4px 12px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--green)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            ✓ Recommended
          </div>

          {/* Tier Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              background: 'rgba(37, 99, 235, 0.1)',
              border: '1px solid rgba(37, 99, 235, 0.2)',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--accent)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            📊 {TIER_LABELS[tier]}
          </div>
        </div>
      </div>
    </div>
  )
}
