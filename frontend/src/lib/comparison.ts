/**
 * Calculate feature similarity between two products
 * Returns a score 0-100 indicating how similar the feature profiles are
 */
export function calculateFeatureSimilarity(
  features1: Record<string, number>,
  features2: Record<string, number>
): number {
  if (Object.keys(features1).length === 0 || Object.keys(features2).length === 0) {
    return 0
  }

  const commonFeatures = Object.keys(features1).filter(f => f in features2)
  if (commonFeatures.length === 0) return 0

  // Calculate average absolute difference in scores
  let totalDiff = 0
  for (const feature of commonFeatures) {
    const diff = Math.abs(features1[feature] - features2[feature])
    totalDiff += diff
  }

  const avgDiff = totalDiff / commonFeatures.length
  // Convert to similarity: 0 diff = 100%, 10 diff = 0%
  const similarity = Math.max(0, 100 - avgDiff * 10)

  return Math.round(similarity)
}

/**
 * Get matching spec tags between two products
 */
export function getMatchingSpecs(
  specs1: Record<string, string>,
  specs2: Record<string, string>
): { matching: string[]; different: string[] } {
  const matching: string[] = []
  const different: string[] = []

  for (const [spec, tag1] of Object.entries(specs1)) {
    if (spec in specs2) {
      const tag2 = specs2[spec]
      if (tag1 === tag2) {
        matching.push(spec)
      } else {
        different.push(spec)
      }
    }
  }

  return { matching, different }
}

/**
 * Format spec name for display (snake_case to Title Case)
 */
export function formatSpecName(spec: string): string {
  return spec
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
