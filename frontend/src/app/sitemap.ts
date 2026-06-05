import type { MetadataRoute } from 'next'

const LOCALES = ['in', 'us', 'uk']
const CATEGORIES = ['tws-earbuds', 'wireless-headphones', 'bluetooth-speakers', 'power-banks', 'smartwatches']

const SEED_PRODUCTS = [
  'boat-airdopes-141',
  'noise-colorfitpro4',
  'mi-power-bank-3i',
  'boat-rockerz-400',
  'noise-iconx',
  'mivi-duopods-m70',
  'realme-buds-q',
  'oneplus-buds-z2',
  'samsung-galaxy-buds2-pro',
  'apple-airpods-pro',
]

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://trustlens.in'
  const today = new Date().toISOString().split('T')[0]

  const urls: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: today,
      changeFrequency: 'daily',
      priority: 1.0,
    },
  ]

  LOCALES.forEach((locale) => {
    // Locale homepage
    urls.push({
      url: `${baseUrl}/${locale}`,
      lastModified: today,
      changeFrequency: 'daily',
      priority: 0.9,
    })

    // Methodology
    urls.push({
      url: `${baseUrl}/${locale}/methodology`,
      lastModified: today,
      changeFrequency: 'monthly',
      priority: 0.7,
    })

    // Submit
    urls.push({
      url: `${baseUrl}/${locale}/submit`,
      lastModified: today,
      changeFrequency: 'weekly',
      priority: 0.8,
    })

    // Fakespot alternative (in locale only)
    if (locale === 'in') {
      urls.push({
        url: `${baseUrl}/${locale}/fakespot-alternative`,
        lastModified: today,
        changeFrequency: 'monthly',
        priority: 0.7,
      })
    }

    // Categories
    CATEGORIES.forEach((category) => {
      urls.push({
        url: `${baseUrl}/${locale}/${category}`,
        lastModified: today,
        changeFrequency: 'weekly',
        priority: 0.8,
      })

      // Product pages (seed products)
      SEED_PRODUCTS.forEach((product) => {
        urls.push({
          url: `${baseUrl}/${locale}/${category}/${product}`,
          lastModified: today,
          changeFrequency: 'weekly',
          priority: 0.6,
        })
      })
    })
  })

  return urls
}
