'use client'

import Link from 'next/link'

interface QuickPickCardProps {
  name: string
  slug: string
  category: string
  trustScore: number
  confidenceTier: string
  label: 'Best Overall' | 'Budget' | 'Premium'
}

export default function QuickPickCard({
  name,
  slug,
  category,
  trustScore,
  confidenceTier,
  label,
}: QuickPickCardProps) {
  const scoreColor =
    trustScore >= 9
      ? 'text-emerald-600'
      : trustScore >= 8
        ? 'text-green-600'
        : trustScore >= 7
          ? 'text-amber-600'
          : 'text-red-600'

  const bgColor =
    label === 'Best Overall'
      ? 'border-yellow-300 bg-yellow-50'
      : label === 'Premium'
        ? 'border-purple-300 bg-purple-50'
        : 'border-blue-300 bg-blue-50'

  const icon = label === 'Best Overall' ? '🏆' : label === 'Premium' ? '👑' : '💰'

  return (
    <Link href={`/${category}/${slug}`}>
      <div
        className={`border-2 rounded-lg p-6 cursor-pointer transition hover:shadow-lg ${bgColor}`}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-gray-600 mb-1">{icon} {label}</p>
            <h3 className="text-lg font-bold text-gray-900 line-clamp-2">{name}</h3>
          </div>
        </div>

        <div className="flex items-baseline gap-2 mb-3">
          <span className={`text-3xl font-bold ${scoreColor}`}>{trustScore}</span>
          <span className="text-sm text-gray-600">/10</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 bg-white border border-gray-300 rounded-full text-gray-700">
            {confidenceTier}
          </span>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-300">
          <button className="text-sm font-semibold text-blue-600 hover:text-blue-700">
            View Verdict →
          </button>
        </div>
      </div>
    </Link>
  )
}
