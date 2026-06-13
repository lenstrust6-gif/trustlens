import { Suspense } from 'react'
import type { Metadata } from 'next'
import VerdictCard from '@/components/VerdictCard'
import VerdictPreview from '@/components/home/VerdictPreview'
import RelatedProducts from '@/components/product/RelatedProducts'
import ComingSoonPage from '@/components/product/ComingSoonPage'
import EarlyVerdictCard from '@/components/product/EarlyVerdictCard'
import { api } from '@/lib/api'
import { notFound } from 'next/navigation'

// Data sufficiency thresholds
const THRESHOLDS = {
  minimum_combined: 25,
  full_verdict_combined: 75,
}

async function VerdictContent({
  locale,
  slug,
  category,
}: {
  locale: string
  slug: string
  category: string
}) {
  try {
    const verdict = await api.getVerdict(locale, slug)

    // Get review counts from verdict data
    const amazonCount = verdict.sourcePanel?.amazonCount || 0
    const youtubeCount = verdict.sourcePanel?.youtubeCount || 0
    const combined = amazonCount + youtubeCount

    // Determine display state
    let displayState: 'coming_soon' | 'early_verdict' | 'full_verdict'

    if (combined < THRESHOLDS.minimum_combined) {
      displayState = 'coming_soon'
    } else if (combined < THRESHOLDS.full_verdict_combined) {
      displayState = 'early_verdict'
    } else {
      displayState = 'full_verdict'
    }

    // Coming Soon State
    if (displayState === 'coming_soon') {
      const daysAgo = Math.floor(
        (new Date().getTime() - new Date(verdict.sourcePanel?.lastRefreshed || new Date()).getTime()) /
          (1000 * 60 * 60 * 24)
      )

      return (
        <ComingSoonPageWrapper
          productName={verdict.product.name}
          category={category}
          amazonReviewCount={amazonCount}
          youtubeVideoCount={youtubeCount}
          detectedDaysAgo={Math.max(daysAgo, 1)}
          locale={locale}
        />
      )
    }

    // Early Verdict State
    if (displayState === 'early_verdict') {
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
          <EarlyVerdictCard
            productName={verdict.product.name}
            category={verdict.product.category || category}
            brand={verdict.product.brand || 'Unknown'}
            trustScore={verdict.trustScore || 0}
            confidenceTier={verdict.confidenceTier || 'early'}
            summary={verdict.summary || 'Early verdict being generated...'}
            pros={
              Array.isArray(verdict.pros) && typeof verdict.pros[0] === 'object'
                ? (verdict.pros as Array<{ text: string; mentions: number }>)
                : []
            }
            cons={
              Array.isArray(verdict.cons) && typeof verdict.cons[0] === 'object'
                ? (verdict.cons as Array<{ text: string; mentions: number }>)
                : []
            }
            amazonCount={amazonCount}
            youtubeCount={youtubeCount}
            dataPoints={combined}
            locale={locale}
          />
        </>
      )
    }

    // Full Verdict State (75+ reviews)
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

// Wrapper for Coming Soon Page with email capture
async function ComingSoonPageWrapper({
  productName,
  category,
  amazonReviewCount,
  youtubeVideoCount,
  detectedDaysAgo,
  locale,
}: {
  productName: string
  category: string
  amazonReviewCount: number
  youtubeVideoCount: number
  detectedDaysAgo: number
  locale: string
}) {
  const handleEmailCapture = async (email: string) => {
    'use server'
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          product_name: productName,
          locale,
        }),
      })
    } catch (error) {
      console.error('Error capturing email:', error)
    }
  }

  return (
    <ComingSoonPage
      productName={productName}
      category={category}
      amazonReviewCount={amazonReviewCount}
      youtubeVideoCount={youtubeVideoCount}
      detectedDaysAgo={detectedDaysAgo}
      onEmailCapture={handleEmailCapture}
    />
  )
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
    <>
      <Suspense fallback={<div className="text-center py-12">Loading verdict...</div>}>
        <VerdictContent locale={locale} slug={product} category={category} />
      </Suspense>
      <RelatedProducts locale={locale} productSlug={product} category={category} />
    </>
  )
}
