import ConfidenceTier from '@/components/shared/ConfidenceTier'

interface TrustScoreProps {
  score: number
  tier: 'early' | 'growing' | 'established' | 'mature'
}

function getScoreColor(score: number): string {
  if (score < 5) return 'text-red-600'
  if (score < 6.9) return 'text-amber-600'
  if (score < 9) return 'text-green-600'
  return 'text-emerald-600'
}

function getScoreBgColor(score: number): string {
  if (score < 5) return 'bg-red-50 border-red-200'
  if (score < 6.9) return 'bg-amber-50 border-amber-200'
  if (score < 9) return 'bg-green-50 border-green-200'
  return 'bg-emerald-50 border-emerald-200'
}

export default function TrustScore({ score, tier }: TrustScoreProps) {
  return (
    <div className={`p-6 border rounded-lg ${getScoreBgColor(score)}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className={`text-5xl font-bold ${getScoreColor(score)}`}>{score.toFixed(1)}</div>
          <p className="text-gray-600 text-sm mt-1">/10 TrustScore</p>
        </div>
        <ConfidenceTier tier={tier} />
      </div>
    </div>
  )
}
