const RECENT_SEARCHES_KEY = 'trustlens_recent_searches'
const MAX_RECENT = 5

export function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function addRecentSearch(query: string): void {
  if (typeof window === 'undefined') return

  try {
    let searches = getRecentSearches()
    searches = searches.filter((s) => s.toLowerCase() !== query.toLowerCase())
    searches.unshift(query)
    searches = searches.slice(0, MAX_RECENT)
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches))
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

export function clearRecentSearches(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY)
  } catch {
    // Silently fail
  }
}
