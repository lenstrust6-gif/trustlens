import { VerdictCard as VerdictCardType } from '@/lib/types'
import TrustScore from './TrustScore'
import ConfidenceTierBadge from '@/components/product/ConfidenceTierBadge'
import FeatureScoresChart from '@/components/product/FeatureScoresChart'
import ReviewHighlights from '@/components/product/ReviewHighlights'
import SourceTransparencyPanel from '@/components/product/SourceTransparencyPanel'

const CATEGORY_LABELS: Record<string, string> = {
  'power-banks': '🔋 Power Banks',
  'tws-earbuds': '🎧 TWS Earbuds',
  'smartwatches': '⌚ Smartwatches',
  'headphones': '🎧 Headphones',
  'speakers': '🔊 Speakers',
}

const FEATURE_LABELS: Record<string, string> = {
  soundQuality: 'Sound Quality',
  batteryLife: 'Battery Life',
  buildQuality: 'Build Quality',
  comfort: 'Comfort',
  noiseIsolation: 'Noise Isolation',
  display: 'Display',
  fitnessTracking: 'Fitness Tracking',
  performanceSpeed: 'Performance',
  capacity: 'Capacity',
  chargingSpeed: 'Charging Speed',
  portCount: 'Port Count',
  portability: 'Portability',
}

function getBarColor(score: number): string {
  if (score >= 7.5) return 'var(--green)'
  if (score >= 5.0) return 'var(--amber)'
  return 'var(--red)'
}

export default function VerdictCard({ card }: { card: VerdictCardType }) {
  // Safely provide defaults for all card properties
  const safeCard = {
    ...card,
    product: card?.product || { name: 'Unknown', category: 'unknown', slug: '', locale: 'in' },
    bestFor: card?.bestFor || [],
    avoidIf: card?.avoidIf || [],
    pros: card?.pros || [],
    cons: card?.cons || [],
    featureScores: card?.featureScores || {},
    specTags: card?.specTags || {},
    reviewHighlights: card?.reviewHighlights || [],
    sourcePanel: card?.sourcePanel || { youtubeCount: 0, amazonCount: 0, authScoreAvg: 0, excludedCount: 0, lastRefreshed: new Date().toISOString() },
  }

  const categoryDisplay = CATEGORY_LABELS[safeCard.product.category] || safeCard.product.category

  return (
    <div
      style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '60px 40px',
        color: 'var(--text-primary)',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <div
          style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            marginBottom: '12px',
            letterSpacing: '0.1em',
            textTransform: 'capitalize',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{categoryDisplay}</span>
          <ConfidenceTierBadge tier={safeCard.confidenceTier} />
        </div>
        <h1
          style={{
            fontSize: '48px',
            fontFamily: 'var(--font-serif)',
            fontWeight: 600,
            marginBottom: '16px',
            color: 'var(--text-primary)',
          }}
        >
          {safeCard.product.name}
        </h1>
      </div>

      {/* TrustScore */}
      <div style={{ marginBottom: '48px' }}>
        <TrustScore score={safeCard.trustScore} tier={safeCard.confidenceTier} />
      </div>

      {/* AI Summary */}
      <div
        style={{
          marginBottom: '48px',
          padding: '24px 28px',
          background: 'rgba(37, 99, 235, 0.06)',
          borderLeft: '3px solid var(--accent)',
          borderRadius: '8px',
        }}
      >
        <div
          style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            marginBottom: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          ✦ AI Verdict
        </div>
        <p
          style={{
            fontSize: '15px',
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            lineHeight: '1.6',
            color: 'var(--text-primary)',
            maxWidth: '680px',
          }}
        >
          {safeCard.summary}
        </p>
      </div>

      {/* Best For / Avoid If */}
      <div
        style={{
          marginBottom: '48px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
          alignItems: 'flex-start',
        }}
      >
        <div
          style={{
            padding: '20px',
            background: 'rgba(16, 185, 129, 0.06)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '8px',
            borderLeft: '3px solid var(--green)',
            alignSelf: 'flex-start',
          }}
        >
          <h3
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--green)',
              marginBottom: '16px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            ✓ Best For
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {safeCard.bestFor.map((item, i) => (
              <li
                key={i}
                style={{
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                  marginBottom: i < safeCard.bestFor.length - 1 ? '8px' : 0,
                  lineHeight: '1.5',
                }}
              >
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div
          style={{
            padding: '20px',
            background: 'rgba(239, 68, 68, 0.06)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '8px',
            borderLeft: '3px solid var(--red)',
            alignSelf: 'flex-start',
          }}
        >
          <h3
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--red)',
              marginBottom: '16px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            ✗ Avoid If
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {safeCard.avoidIf.map((item, i) => (
              <li
                key={i}
                style={{
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                  marginBottom: i < safeCard.avoidIf.length - 1 ? '8px' : 0,
                  lineHeight: '1.5',
                }}
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Pros / Cons */}
      <div
        style={{
          marginBottom: '48px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
        }}
      >
        <div>
          <h3
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--green)',
              marginBottom: '16px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            Pros
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {safeCard.pros.map((pro, i) => (
              <li
                key={i}
                style={{
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                  marginBottom: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <span style={{ flex: 1 }}>✓ {pro.text}</span>
                <span
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    marginLeft: '12px',
                    flexShrink: 0,
                  }}
                >
                  ({pro.mentions})
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--red)',
              marginBottom: '16px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            Cons
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {safeCard.cons.map((con, i) => (
              <li
                key={i}
                style={{
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                  marginBottom: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <span style={{ flex: 1 }}>✗ {con.text}</span>
                <span
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    marginLeft: '12px',
                    flexShrink: 0,
                  }}
                >
                  ({con.mentions})
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Spec Sentiment Tags */}
      {Object.keys(safeCard.specTags).length > 0 && (
        <div style={{ marginBottom: '48px' }}>
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '24px',
              fontFamily: 'var(--font-body)',
            }}
          >
            Spec Sentiment
          </h2>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            {Object.entries(safeCard.specTags).map(([spec, sentiment]) => {
              let icon = '⚠️'
              let color = '#f59e0b'

              if (sentiment === 'confirms') {
                icon = '✅'
                color = '#10b981'
              } else if (sentiment === 'disputes') {
                icon = '❌'
                color = '#ef4444'
              }

              return (
                <div
                  key={spec}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    background: `${color}15`,
                    border: `1px solid ${color}40`,
                    borderRadius: '6px',
                    fontSize: '13px',
                    color: color,
                    fontWeight: 500,
                  }}
                >
                  <span>{icon}</span>
                  <span>{spec.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Feature Scores + Review Highlights */}
      <div
        style={{
          marginBottom: '48px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '40px',
          alignItems: 'start',
        }}
      >
        <div>
          <FeatureScoresChart features={safeCard.featureScores} />
        </div>
        <div>
          <ReviewHighlights highlights={safeCard.reviewHighlights} />
        </div>
      </div>

      {/* Source Transparency Panel */}
      <SourceTransparencyPanel
        youtubeCount={safeCard.sourcePanel.youtubeCount}
        amazonCount={safeCard.sourcePanel.amazonCount}
        authScoreAvg={safeCard.sourcePanel.authScoreAvg}
        excludedCount={safeCard.sourcePanel.excludedCount}
        lastRefreshed={safeCard.sourcePanel.lastRefreshed}
      />
    </div>
  )
}
