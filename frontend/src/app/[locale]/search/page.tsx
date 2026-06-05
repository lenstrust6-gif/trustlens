'use client'

import { Suspense, use } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import VerdictCard from '@/components/VerdictCard'
import { VerdictCard as VerdictCardType } from '@/lib/types'

function SearchPageContent({ locale }: { locale: string }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get('q') || ''

  const [verdict, setVerdict] = useState<VerdictCardType | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!query) return

    setLoading(true)
    setError(null)

    api
      .search(query, locale)
      .then((data) => {
        setVerdict(data)
        setError(null)
      })
      .catch((err) => {
        setError('No reviews found for this product')
        setVerdict(null)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [query, locale])

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-8">
        <input
          type="text"
          placeholder="Search products..."
          defaultValue={query}
          onChange={(e) => {
            const value = e.target.value
            if (value.trim()) {
              router.push(`/${locale}/search?q=${encodeURIComponent(value)}`)
            }
          }}
          className="w-full px-6 py-3 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
        />
      </div>

      {loading && <div className="text-center py-12 text-gray-500">Searching...</div>}

      {error && (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <p className="font-semibold">{error}</p>
          <p className="text-sm mt-2">Try submitting it for analysis.</p>
        </div>
      )}

      {verdict && !loading && <VerdictCard card={verdict} />}
    </div>
  )
}

export default function SearchPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params)
  return (
    <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
      <SearchPageContent locale={locale} />
    </Suspense>
  )
}
