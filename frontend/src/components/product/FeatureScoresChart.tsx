interface FeatureScore {
  name: string
  score: number
}

interface FeatureScoresChartProps {
  features?: FeatureScore[] | Record<string, number>
}

export default function FeatureScoresChart({ features }: FeatureScoresChartProps) {
  if (!features) return null

  // Convert to array if object
  const featureArray: FeatureScore[] = Array.isArray(features)
    ? features
    : Object.entries(features).map(([name, score]) => ({
        name: name.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        score: typeof score === 'number' ? score : 0,
      }))

  if (!featureArray.length) return null

  // Limit to top 6 features
  const topFeatures = featureArray.slice(0, 6)

  return (
    <div style={{ marginBottom: '24px' }}>
      <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)' }}>
        Feature Scores
      </h3>
      <div style={{ display: 'grid', gap: '12px' }}>
        {topFeatures.map((feature) => {
          const percentage = (feature.score / 10) * 100
          const barColor = feature.score >= 8 ? '#10b981' : feature.score >= 6 ? '#f59e0b' : '#ef4444'

          return (
            <div key={feature.name} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ flex: '0 0 120px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                {feature.name}
              </div>
              <div
                style={{
                  flex: 1,
                  height: '6px',
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: '3px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${percentage}%`,
                    background: barColor,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
              <div style={{ flex: '0 0 35px', fontSize: '13px', fontWeight: '600', textAlign: 'right', color: barColor }}>
                {feature.score.toFixed(1)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
