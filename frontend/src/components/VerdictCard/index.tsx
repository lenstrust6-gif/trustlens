import { VerdictCard as VerdictCardType } from '@/lib/types'
import TrustScore from './TrustScore'

export default function VerdictCard({ card }: { card: VerdictCardType }) {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{card.product.name}</h1>
        <p className="text-gray-600">{card.product.category}</p>
      </div>

      {/* TrustScore */}
      <div className="mb-8">
        <TrustScore score={card.trustScore} tier={card.confidenceTier} />
      </div>

      {/* Summary */}
      <div className="mb-8 p-6 bg-gray-50 rounded-lg">
        <p className="text-gray-800 leading-relaxed">{card.summary}</p>
      </div>

      {/* Best For / Avoid If */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-700 mb-3">✅ Best For</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            {card.bestFor.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="p-4 border border-red-200 rounded-lg">
          <h3 className="font-semibold text-red-700 mb-3">❌ Avoid If</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            {card.avoidIf.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Pros / Cons */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-3 text-green-700">Pros</h3>
          <ul className="space-y-2 text-sm">
            {card.pros.map((pro, i) => (
              <li key={i} className="text-gray-700">
                {pro.text}
                <span className="text-gray-500 ml-2">({pro.mentions})</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-3 text-red-700">Cons</h3>
          <ul className="space-y-2 text-sm">
            {card.cons.map((con, i) => (
              <li key={i} className="text-gray-700">
                {con.text}
                <span className="text-gray-500 ml-2">({con.mentions})</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Feature Scores */}
      <div className="mb-8">
        <h3 className="font-semibold mb-4">Feature Scores</h3>
        <div className="space-y-3">
          {Object.entries(card.featureScores).map(([feature, score]) => (
            <div key={feature}>
              <div className="flex justify-between text-sm mb-1">
                <span className="capitalize text-gray-700">{feature.replace(/_/g, ' ')}</span>
                <span className="font-semibold">{score.toFixed(1)}/10</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(score / 10) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Source Panel */}
      <div className="p-6 bg-gray-50 rounded-lg text-sm text-gray-600">
        <h3 className="font-semibold text-gray-900 mb-3">Data Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="font-semibold text-gray-900">{card.sourcePanel.youtubeCount}</p>
            <p>YouTube Comments</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900">{card.sourcePanel.amazonCount}</p>
            <p>Amazon Reviews</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900">{card.sourcePanel.authScoreAvg.toFixed(0)}</p>
            <p>Avg Auth Score</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900">{card.sourcePanel.excludedCount}</p>
            <p>Excluded</p>
          </div>
        </div>
      </div>
    </div>
  )
}
