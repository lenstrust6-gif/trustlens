import { VerdictCard } from './types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Mock data for UI demonstration when backend is unavailable
const MOCK_VERDICTS: Record<string, VerdictCard> = {
  'boat-airdopes-141': {
    product: { name: 'boAt Airdopes 141', slug: 'boat-airdopes-141', category: 'tws-earbuds', locale: 'in' },
    trustScore: 8.3,
    confidenceTier: 'established',
    summary: 'The boAt Airdopes 141 offers excellent value for money with solid audio quality and impressive battery life. These TWS earbuds are perfect for daily commuters and casual listeners. Build quality feels premium despite the price, and the touch controls are responsive. Bass is punchy without being overwhelming, making them versatile for various music genres.',
    bestFor: ['Budget-conscious buyers', 'Commuters', 'Casual listeners', 'Bass lovers'],
    avoidIf: ['Audiophiles', 'Noise-cancellation seekers'],
    pros: [{ text: 'Great audio quality for the price', mentions: 156 }, { text: 'Long battery life (up to 8 hours)', mentions: 142 }, { text: 'Comfortable fit and lightweight', mentions: 89 }],
    cons: [{ text: 'No active noise cancellation', mentions: 67 }, { text: 'Occasional connectivity issues', mentions: 34 }],
    featureScores: { soundQuality: 7.8, batteryLife: 8.2, buildQuality: 7.5, comfort: 8.1, noiseIsolation: 5.5 },
    specTags: { sound: 'confirms', battery: 'confirms', noiseCancel: 'disputes' },
    reviewHighlights: [
      { source: 'amazon', text: 'Perfect for the price point. Great sound and battery life!', rating: 5, authScore: 85 },
      { source: 'youtube', text: 'Using these for almost a month now. No regrets so far.', rating: 5, authScore: 82 },
      { source: 'amazon', text: 'Best value TWS earbuds under 2000 rupees.', rating: 5, authScore: 88 }
    ],
    sourcePanel: { youtubeCount: 42, amazonCount: 38, authScoreAvg: 74.5, excludedCount: 8, lastRefreshed: new Date().toISOString() },
    alternatives: [],
    locale: 'in',
  },
  'noise-colorfitpro4': {
    product: { name: 'Noise ColorFit Pro 4', slug: 'noise-colorfitpro4', category: 'smartwatches', locale: 'in' },
    trustScore: 7.9,
    confidenceTier: 'established',
    summary: 'A feature-rich smartwatch that delivers excellent value with a vibrant AMOLED display and comprehensive health tracking. The ColorFit Pro 4 handles daily tasks efficiently with good battery life and responsive performance. Perfect for fitness enthusiasts and health-conscious users. Build quality is solid, though some may find it slightly heavy for continuous wear.',
    bestFor: ['Fitness enthusiasts', 'Health-conscious users', 'Budget shoppers'],
    avoidIf: ['Minimalist design lovers', 'Apple ecosystem users'],
    pros: [{ text: 'Beautiful AMOLED display', mentions: 198 }, { text: 'Great battery life (10 days)', mentions: 176 }, { text: 'Comprehensive fitness tracking', mentions: 145 }],
    cons: [{ text: 'Slightly heavy for all-day wear', mentions: 56 }, { text: 'Limited third-party app support', mentions: 43 }],
    featureScores: { display: 8.5, batteryLife: 8.0, fitnessTracking: 7.9, buildQuality: 7.4, performanceSpeed: 7.6 },
    specTags: { display: 'confirms', battery: 'confirms', fitness: 'confirms' },
    reviewHighlights: [
      { source: 'amazon', text: 'The display is absolutely stunning. Worth every rupee!', rating: 5, authScore: 87 },
      { source: 'youtube', text: 'Battery lasts almost 2 weeks with moderate use.', rating: 5, authScore: 84 },
      { source: 'amazon', text: 'Best smartwatch in this price range hands down.', rating: 5, authScore: 86 }
    ],
    sourcePanel: { youtubeCount: 35, amazonCount: 42, authScoreAvg: 76.2, excludedCount: 12, lastRefreshed: new Date().toISOString() },
    alternatives: [],
    locale: 'in',
  },
  'mi-power-bank-3i': {
    product: { name: 'Mi Power Bank 3i', slug: 'mi-power-bank-3i', category: 'power-banks', locale: 'in' },
    trustScore: 8.1,
    confidenceTier: 'established',
    summary: 'An affordable power bank that provides reliable charging with dual USB ports and compact design. The 20000mAh capacity is perfect for extended trips or heavy users. Fast charging support and solid build quality make it a practical choice. Perfect balance between price, capacity, and performance for everyday use.',
    bestFor: ['Travel enthusiasts', 'Heavy users', 'Budget-conscious buyers'],
    avoidIf: ['Wireless charging seekers'],
    pros: [{ text: 'Excellent capacity for the price', mentions: 187 }, { text: 'Dual USB ports', mentions: 134 }, { text: 'Compact and lightweight design', mentions: 121 }],
    cons: [{ text: 'No wireless charging', mentions: 48 }, { text: 'Slow charging time when fully depleted', mentions: 35 }],
    featureScores: { capacity: 8.2, chargingSpeed: 7.6, portCount: 8.3, buildQuality: 8.0, portability: 8.1 },
    specTags: { capacity: 'confirms', chargeSpeed: 'mixed', ports: 'confirms' },
    reviewHighlights: [
      { source: 'amazon', text: 'Great power bank. Charges my phone 5 times easily.', rating: 5, authScore: 89 },
      { source: 'youtube', text: 'Using it for 6 months. Still working like new.', rating: 5, authScore: 88 },
      { source: 'amazon', text: 'Best bang for your buck. Highly recommended!', rating: 5, authScore: 85 }
    ],
    sourcePanel: { youtubeCount: 48, amazonCount: 45, authScoreAvg: 75.8, excludedCount: 9, lastRefreshed: new Date().toISOString() },
    alternatives: [],
    locale: 'in',
  },
}

export interface SearchResults {
  total: number
  results: VerdictCard[]
  filters_applied: any
}

export const api = {
  async search(productName: string, locale: string, filters?: any): Promise<SearchResults> {
    const searchLower = productName.toLowerCase()

    // Build request with filters (map frontend filter names to backend names)
    const searchBody: any = {
      product_name: productName,
      locale,
      trust_score_min: filters?.trust_min ?? 0,
      trust_score_max: filters?.trust_max ?? 10,
      auth_score_min: filters?.auth_min ?? 0,
      source: filters?.source ?? 'all',
      confidence_tiers: filters?.confidence_tiers ?? [],
    }

    // DEBUG: Force mock data to test if real API is causing .map() error
    const FORCE_MOCK = true

    if (!FORCE_MOCK) {
      // Try API call first
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 2000)

        const res = await fetch(`${API_URL}/api/v1/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(searchBody),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (res.ok) {
        const data = await res.json()
        console.log('[API Search] Raw response:', data)

        // Ensure results is always an array
        let results = []
        if (Array.isArray(data?.results)) {
          results = data.results.map((r: any) => {
            try {
              return {
                product: r?.product || { name: 'Unknown', category: '', slug: '', locale: 'in' },
                trustScore: typeof r?.trust_score === 'number' ? r.trust_score : 0,
                confidenceTier: r?.confidence_tier || 'unknown',
                summary: r?.summary || '',
                pros: Array.isArray(r?.pros) ? r.pros : [],
                cons: Array.isArray(r?.cons) ? r.cons : [],
                bestFor: Array.isArray(r?.best_for) ? r.best_for : [],
                avoidIf: Array.isArray(r?.avoid_if) ? r.avoid_if : [],
                featureScores: typeof r?.feature_scores === 'object' ? r.feature_scores : {},
                specTags: typeof r?.spec_tags === 'object' ? r.spec_tags : {},
                reviewHighlights: Array.isArray(r?.review_highlights) ? r.review_highlights : [],
                sourcePanel: {
                  youtubeCount: r?.source_count_yt || 0,
                  amazonCount: r?.source_count_amz || 0,
                  authScoreAvg: r?.auth_score_avg || 0,
                  excludedCount: r?.reviews_excluded || 0,
                  lastRefreshed: new Date().toISOString(),
                },
                alternatives: [],
                locale: r?.locale || 'in',
              }
            } catch (err) {
              console.error('[API Search] Error transforming result:', r, err)
              return null
            }
          }).filter((r: any) => r !== null)
        }

        console.log('[API Search] Transformed results:', results)
        return {
          total: results.length,
          results,
          filters_applied: data?.filters_applied || {},
        }
      }
      } catch (error) {
        // Fall through to mock data
      }
    }

    // Fallback: filter mock data locally
    let filtered = Object.values(MOCK_VERDICTS)

    // Match by search term
    filtered = filtered.filter(v => {
      const name = v.product.name.toLowerCase()
      return name.includes(searchLower) || searchLower.includes(name.split(' ')[0])
    })

    // Apply filters if provided
    if (filters) {
      if (filters.trust_score_min !== undefined) {
        filtered = filtered.filter(v => v.trustScore >= filters.trust_score_min)
      }
      if (filters.trust_score_max !== undefined) {
        filtered = filtered.filter(v => v.trustScore <= filters.trust_score_max)
      }
      if (filters.auth_score_min !== undefined) {
        filtered = filtered.filter(v => v.sourcePanel.authScoreAvg >= filters.auth_score_min)
      }
      if (filters.source === 'youtube') {
        filtered = filtered.filter(v => v.sourcePanel.youtubeCount > 0)
      } else if (filters.source === 'amazon') {
        filtered = filtered.filter(v => v.sourcePanel.amazonCount > 0)
      }
      if (filters.confidence_tiers?.length > 0) {
        filtered = filtered.filter(v => filters.confidence_tiers.includes(v.confidenceTier))
      }
    }

    // Return filtered results (may be empty)
    return {
      total: filtered.length,
      results: filtered,
      filters_applied: filters || {},
    }
  },

  async getFilterStats(locale: string = 'in', category?: string) {
    try {
      const params = new URLSearchParams({ locale })
      if (category) params.append('category', category)

      const res = await fetch(`${API_URL}/api/v1/search/filter-stats?${params}`, {
        headers: { 'Content-Type': 'application/json' },
      })

      if (res.ok) {
        const data = await res.json()
        console.log('[FilterStats] Raw API response:', data)
        // Return with proper defaults for missing fields
        return {
          trust_score_range: data.trust_score_range || [0, 10],
          auth_score_range: data.auth_score_range || [0, 100],
          sources: data.sources || [],
          confidence_tiers: data.confidence_tiers || [],
          categories: data.categories || [],
          total_products: data.total_products || 0,
        }
      }
    } catch (error) {
      console.error('Error fetching filter stats:', error)
    }

    // Return default empty stats
    return {
      trust_score_range: [0, 10],
      auth_score_range: [0, 100],
      sources: [],
      confidence_tiers: [],
      categories: [],
      total_products: 0,
    }
  },

  async getVerdict(locale: string, slug: string): Promise<VerdictCard> {
    const res = await fetch(`${API_URL}/api/v1/verdict/${locale}/${slug}`)

    if (!res.ok) {
      throw new Error(`Verdict not found: ${res.status}`)
    }

    return res.json()
  },

  async submit(productName: string, email: string, locale: string): Promise<{ status: string; message: string }> {
    const res = await fetch(`${API_URL}/api/v1/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_name: productName, email, locale }),
    })

    if (!res.ok) {
      throw new Error(`Submit failed: ${res.status}`)
    }

    return res.json()
  },

  async getCategories(locale: string): Promise<any> {
    const res = await fetch(`${API_URL}/api/v1/categories/${locale}`)

    if (!res.ok) {
      throw new Error(`Categories failed: ${res.status}`)
    }

    return res.json()
  },
}
