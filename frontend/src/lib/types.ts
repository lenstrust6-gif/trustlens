export interface Product {
  name: string
  slug: string
  category: string
  locale: string
}

export interface VerdictCard {
  product: Product
  trustScore: number  // 0.0-10.0
  confidenceTier: 'early' | 'growing' | 'established' | 'mature'
  summary: string  // 80-120 words
  pros: Array<{ text: string; mentions: number }>
  cons: Array<{ text: string; mentions: number }>
  bestFor: string[]
  avoidIf: string[]
  specTags: Record<string, 'confirms' | 'mixed' | 'disputes'>
  featureScores: Record<string, number>  // 0.0-10.0
  reviewHighlights: Array<{
    source: 'youtube' | 'amazon'
    text: string
    rating: number
    authScore: number  // 0-100
  }>
  sourcePanel: {
    youtubeCount: number
    amazonCount: number
    authScoreAvg: number
    excludedCount: number
    lastRefreshed: string
  }
  alternatives: Array<{
    name: string
    slug: string
    trustScore: number
    reason: string
  }>
  locale: string
}

export interface SearchMiss {
  query: string
  locale: string
  count: number
  lastSearched: string
}
