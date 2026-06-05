'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function FakespotAlternativePage({ params }: { params: { locale: string } }) {
  const router = useRouter()
  const [search, setSearch] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) {
      router.push(`/${params.locale}/search?q=${encodeURIComponent(search)}`)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-4">Fakespot Alternative for India</h1>
      <p className="text-gray-600 text-lg mb-8">
        TrustLens is the AI-powered alternative to Fakespot, helping you make confident purchase decisions on Amazon and YouTube reviews.
      </p>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4 text-blue-900">Why TrustLens?</h2>
        <ul className="space-y-3 text-gray-800">
          <li>
            <strong>Authenticity Scoring:</strong> Our AI analyzes each review across 6 dimensions (specificity, credibility, coherence, timing, uniqueness, sentiment) to measure genuine feedback.
          </li>
          <li>
            <strong>Multi-Source Analysis:</strong> We combine YouTube video comments and Amazon verified purchase reviews for a complete picture.
          </li>
          <li>
            <strong>India-First:</strong> Built specifically for Indian products and local brands like boAt, Noise, Realme, and Mi.
          </li>
          <li>
            <strong>AI-Powered Insights:</strong> Our verdict cards synthesize thousands of reviews into actionable pro/con lists and trust scores (0-10).
          </li>
        </ul>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">How It Works</h2>
        <ol className="space-y-3 text-gray-800">
          <li>
            <strong>1. Collect:</strong> We gather reviews from YouTube and Amazon.in for the product you're researching.
          </li>
          <li>
            <strong>2. Score:</strong> Each review is scored for authenticity using our 6-signal model. We filter out spam and unverified feedback.
          </li>
          <li>
            <strong>3. Synthesize:</strong> Claude AI summarizes the consensus into an 80–120 word verdict with pros, cons, and user profiles.
          </li>
          <li>
            <strong>4. Deliver:</strong> You get a Trust Score (0-10), confidence tier, and transparent breakdown of data sources.
          </li>
        </ol>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">Try It Now</h2>
        <form onSubmit={handleSearch} className="space-y-4">
          <input
            type="text"
            placeholder="Search any product... (e.g., boAt Airdopes 141)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-6 py-3 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="w-full px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
          >
            Search Product
          </button>
        </form>
      </div>

      <div className="border-t border-gray-300 pt-8">
        <h2 className="text-xl font-bold mb-4">What is Authenticity Score?</h2>
        <p className="text-gray-800 leading-relaxed">
          We never use the phrase "fake review". Instead, we measure <strong>Authenticity Score</strong> — a 0–100 rating that reflects
          how credible, detailed, and genuine a review appears. Authentic reviews get higher scores and appear in our verdict highlights.
          Unverified or low-authenticity reviews are filtered out entirely, so you only see feedback from real customers.
        </p>
      </div>
    </div>
  )
}
