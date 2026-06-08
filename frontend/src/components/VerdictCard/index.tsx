import { VerdictCard as VerdictCardType } from '@/lib/types'
import TrustScore from './TrustScore'

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
          }}
        >
          {categoryDisplay}
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

      {/* Feature Scores */}
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
          Feature Scores
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {Object.entries(safeCard.featureScores).map(([feature, score]) => (
            <div key={feature}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}
              >
                <span
                  style={{
                    fontSize: '14px',
                    color: 'var(--text-primary)',
                    fontWeight: 500,
                  }}
                >
                  {FEATURE_LABELS[feature] || feature}
                </span>
                <span
                  style={{
                    fontSize: '14px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                  }}
                >
                  {score.toFixed(1)}/10
                </span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '6px',
                  background: 'rgba(255,255,255,0.10)',
                  borderRadius: '3px',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${(score / 10) * 100}%`,
                    background: getBarColor(score),
                    borderRadius: '3px',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Source Panel */}
      <div
        style={{
          padding: '24px 28px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
        }}
      >
        <h3
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '24px',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          Data Summary
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '24px',
            maxWidth: '400px',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '22px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '4px',
              }}
            >
              {safeCard.sourcePanel.youtubeCount}
            </div>
            <div
              style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                textTransform: 'capitalize',
              }}
            >
              YouTube Comments
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '22px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '4px',
              }}
            >
              {safeCard.sourcePanel.amazonCount}
            </div>
            <div
              style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                textTransform: 'capitalize',
              }}
            >
              Amazon Reviews
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '22px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '4px',
              }}
            >
              {safeCard.sourcePanel.authScoreAvg.toFixed(0)}
            </div>
            <div
              style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                textTransform: 'capitalize',
              }}
            >
              Avg Auth Score
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '22px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '4px',
              }}
            >
              {safeCard.sourcePanel.excludedCount}
            </div>
            <div
              style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                textTransform: 'capitalize',
              }}
            >
              Excluded
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
