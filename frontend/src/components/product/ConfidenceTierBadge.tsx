interface ConfidenceTierBadgeProps {
  tier: string
  reviewCount?: number
}

const tierConfig: Record<string, { color: string; icon: string; label: string }> = {
  early: {
    color: '#6366f1',
    icon: '⭕',
    label: 'Early (0–25 reviews)',
  },
  growing: {
    color: '#f59e0b',
    icon: '🟡',
    label: 'Growing (26–100 reviews)',
  },
  established: {
    color: '#10b981',
    icon: '🟢',
    label: 'Established (101–500 reviews)',
  },
  mature: {
    color: '#059669',
    icon: '✓',
    label: 'Mature (500+ reviews)',
  },
}

export default function ConfidenceTierBadge({ tier, reviewCount }: ConfidenceTierBadgeProps) {
  const config = tierConfig[tier?.toLowerCase() || 'early'] || tierConfig.early

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        background: `${config.color}15`,
        border: `1px solid ${config.color}40`,
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '500',
        color: config.color,
      }}
      title={config.label}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </div>
  )
}
