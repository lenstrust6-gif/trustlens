export const LOCALE_CONFIG = {
  in: {
    name: 'India',
    flag: '🇮🇳',
    currency: '₹',
    currencyCode: 'INR',
    amazonMarketplace: 'amazon.in',
    youtubeLanguages: ['en', 'hi'],
    budgetTiers: ['₹2,000', '₹5,000', '₹10,000', '₹20,000'],
    localBrands: ['boAt', 'Noise', 'Realme', 'Fire-Boltt', 'Ambrane', 'Mivi'],
    live: true,
  },
  us: {
    name: 'United States',
    flag: '🇺🇸',
    currency: '$',
    currencyCode: 'USD',
    amazonMarketplace: 'amazon.com',
    youtubeLanguages: ['en'],
    budgetTiers: ['$30', '$75', '$150', '$300'],
    localBrands: [],
    live: false,
  },
  uk: {
    name: 'United Kingdom',
    flag: '🇬🇧',
    currency: '£',
    currencyCode: 'GBP',
    amazonMarketplace: 'amazon.co.uk',
    youtubeLanguages: ['en'],
    budgetTiers: ['£25', '£60', '£120', '£250'],
    localBrands: [],
    live: false,
  },
} as const

export type Locale = keyof typeof LOCALE_CONFIG

export function getLocaleConfig(locale: string): (typeof LOCALE_CONFIG)[Locale] | null {
  if (locale in LOCALE_CONFIG) {
    return LOCALE_CONFIG[locale as Locale]
  }
  return null
}
