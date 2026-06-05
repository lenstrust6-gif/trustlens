export default function MethodologyPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-8">Methodology</h1>

      <div className="prose max-w-none space-y-6">
        <section>
          <h2 className="text-2xl font-bold mb-4">How TrustLens Works</h2>
          <p className="text-gray-700 leading-relaxed">
            TrustLens analyzes authentic product reviews from YouTube and Amazon to provide an intelligent verdict. We combine human reviews with AI analysis to identify genuine feedback patterns.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Data Sources</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Amazon product reviews (verified purchases)</li>
            <li>YouTube video comments and dedicated reviews</li>
            <li>No synthetic, AI-generated, or paid reviews included</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Trust Score</h2>
          <p className="text-gray-700 leading-relaxed">
            The Trust Score (0-10) represents the consensus opinion of authentic reviewers:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mt-2">
            <li><strong>0–4.9:</strong> Avoid this product</li>
            <li><strong>5–6.9:</strong> Mixed reviews, consider alternatives</li>
            <li><strong>7–8.9:</strong> Recommended for most use cases</li>
            <li><strong>9–10:</strong> Excellent product worth buying</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Authenticity Scoring</h2>
          <p className="text-gray-700 leading-relaxed">
            Each review is scored on 6 dimensions to measure authenticity and credibility:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mt-2">
            <li>Specificity: Does it mention concrete details?</li>
            <li>Credibility: Does the reviewer have experience with this product?</li>
            <li>Coherence: Is the review logically structured?</li>
            <li>Timing: Is it recent and relevant?</li>
            <li>Uniqueness: Is it an original perspective?</li>
            <li>Sentiment: Does it match the rating?</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Transparency</h2>
          <p className="text-gray-700 leading-relaxed">
            Every verdict card shows:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mt-2">
            <li>Number of reviews analyzed</li>
            <li>Authenticity score distribution</li>
            <li>Excluded reviews (spam, unverified)</li>
            <li>Data refresh timestamp</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Disclaimer</h2>
          <p className="text-gray-700 leading-relaxed">
            TrustLens provides analysis for informational purposes only. Individual experiences may vary. Always verify critical specifications before purchase. We do not endorse any products.
          </p>
        </section>
      </div>
    </div>
  )
}
