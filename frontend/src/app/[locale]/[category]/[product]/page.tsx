import { Suspense, ReactNode } from 'react'
import type { Metadata } from 'next'
import VerdictCard from '@/components/VerdictCard'
import RelatedProducts from '@/components/product/RelatedProducts'
import { api } from '@/lib/api'
import { notFound } from 'next/navigation'

async function VerdictContent({ locale, slug }: { locale: string; slug: string }) {
  try {
    const verdict = await api.getVerdict(locale, slug)

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Review',
              itemReviewed: {
                '@type': 'Product',
                name: verdict.product.name,
              },
              reviewRating: {
                '@type': 'Rating',
                ratingValue: verdict.trustScore,
                bestRating: 10,
              },
              author: {
                '@type': 'Organization',
                name: 'TrustLens',
              },
              reviewBody: verdict.summary,
            }),
          }}
        />
        <VerdictCard card={verdict} />
      </>
    )
  } catch (error) {
    notFound()
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; category: string; product: string }>
}): Promise<Metadata> {
  const { locale, product } = await params

  try {
    const verdict = await api.getVerdict(locale, product)
    return {
      title: `${verdict.product.name} - TrustLens Review | Authenticity Score ${verdict.trustScore.toFixed(1)}/10`,
      description: verdict.summary.substring(0, 160),
      openGraph: {
        title: `${verdict.product.name} - TrustLens`,
        description: verdict.summary.substring(0, 160),
        type: 'article',
      },
    }
  } catch {
    return {
      title: 'Product Review - TrustLens',
      description: 'Read authentic product reviews on TrustLens',
    }
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; category: string; product: string }>
}) {
  const { locale, product, category } = await params
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <Suspense fallback={<div className="text-center py-12">Loading verdict...</div>}>
        <VerdictContent locale={locale} slug={product} />
      </Suspense>
      <RelatedProducts locale={locale} productSlug={product} category={category} />
    </div>
  )
}
