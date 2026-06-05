'use client'

import { useState } from 'react'

interface AffiliateButtonProps {
  productId: string
  productName: string
  onBeforeClick?: () => void
}

export default function AffiliateButton({
  productId,
  productName,
  onBeforeClick,
}: AffiliateButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (onBeforeClick) {
      onBeforeClick()
    }

    setLoading(true)

    try {
      // Record click for tracking
      const response = await fetch(
        `/api/v1/products/${productId}/affiliate-link/click`,
        { method: 'POST' }
      )

      if (response.ok) {
        // Open Amazon link in new tab
        const affiliateResponse = await fetch(
          `/api/v1/products/${productId}/affiliate-link`
        )
        const data = await affiliateResponse.json()

        if (data.status === 'ok' && data.affiliateLink?.amazonUrl) {
          window.open(data.affiliateLink.amazonUrl, '_blank')
        }
      }
    } catch (error) {
      console.error('Error recording affiliate click:', error)
      // Fallback: open Amazon search
      window.open(
        `https://www.amazon.in/s?k=${encodeURIComponent(productName)}`,
        '_blank'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
    >
      {loading ? (
        <>
          <span className="animate-spin">⏳</span>
          Opening...
        </>
      ) : (
        <>
          <span>🛒</span>
          View on Amazon
        </>
      )}
    </button>
  )
}
