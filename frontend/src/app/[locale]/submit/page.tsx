'use client'
export const dynamic = 'force-dynamic'

import { use, useState } from 'react'

export default function SubmitPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params)
  const [productName, setProductName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_name: productName,
          email,
          locale,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to submit')
      }

      const data = await res.json()
      if (data.message) {
        setMessage(data.message)
        setProductName('')
        setEmail('')
      } else {
        setError('Invalid response from server')
      }
    } catch (err) {
      setError('Failed to submit. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-4">Suggest a Product</h1>
      <p className="text-gray-600 mb-8">
        Can't find a product you're looking for? Submit it below and we'll analyze it. We'll email you when the verdict is ready.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg border border-gray-200">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Product Name</label>
          <input
            type="text"
            placeholder="e.g., boAt Airdopes 121"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>

        {message && <div className="p-4 bg-green-50 text-green-800 border border-green-200 rounded-lg">{message}</div>}

        {error && <div className="p-4 bg-red-50 text-red-800 border border-red-200 rounded-lg">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Submitting...' : 'Submit for Analysis'}
        </button>
      </form>
    </div>
  )
}
