interface ConfidenceTierProps {
  tier: 'early' | 'growing' | 'established' | 'mature'
}

const TIER_CONFIG = {
  early: {
    emoji: '🌱',
    label: 'Early Verdict',
    color: 'bg-blue-100 text-blue-800',
  },
  growing: {
    emoji: '📈',
    label: 'Growing Verdict',
    color: 'bg-blue-100 text-blue-800',
  },
  established: {
    emoji: '📊',
    label: 'Established Verdict',
    color: 'bg-green-100 text-green-800',
  },
  mature: {
    emoji: '✅',
    label: 'Mature Verdict',
    color: 'bg-green-100 text-green-800',
  },
}

export default function ConfidenceTier({ tier }: ConfidenceTierProps) {
  const config = TIER_CONFIG[tier]

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
      {config.emoji}
      {config.label}
    </span>
  )
}
