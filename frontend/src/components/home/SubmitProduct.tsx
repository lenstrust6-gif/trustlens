'use client'

import { useState } from 'react'
import SectionLabel from '../shared/SectionLabel'

interface SubmitProductProps {
  locale: string
}

export default function SubmitProduct({ locale }: SubmitProductProps) {
  const [productName, setProductName] = useState('')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/v1/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_name: productName,
          email: email || null,
          locale,
        }),
      })

      if (response.ok) {
        setSubmitted(true)
        setProductName('')
        setEmail('')
      } else {
        setError('Something went wrong. Please try again.')
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section
      style={{
        padding: '50px 40px',
        background: 'rgba(255,255,255,0.02)',
        borderTop: '1px solid var(--border)',
      }}
      className="px-5 sm:px-8"
    >
      <div
        className="container"
        style={{ maxWidth: '680px', margin: '0 auto' }}
      >
        <SectionLabel text="CAN'T FIND YOUR PRODUCT?" />
        <h2 style={{ marginBottom: '16px', textAlign: 'center' }}>
          Tell us. We'll analyse it within 24 hours.
        </h2>

        <p
          style={{
            fontSize: '16px',
            color: 'var(--text-secondary)',
            textAlign: 'center',
            marginBottom: '36px',
          }}
        >
          No account needed. Just give us the product name — and optionally your email
          so we can notify you when the verdict is ready.
        </p>

        {submitted ? (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center',
              color: 'var(--green)',
              fontSize: '14px',
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>✓</div>
            <p>
              Received. We'll notify you within 24 hours when the verdict is ready.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {error && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  padding: '12px',
                  color: 'var(--red)',
                  fontSize: '13px',
                }}
              >
                {error}
              </div>
            )}

            {/* Product Name Input */}
            <input
              type="text"
              placeholder="Product name or Amazon.in URL"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              required
              style={{
                width: '100%',
                height: '52px',
                padding: '0 16px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px',
                fontSize: '15px',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)',
                transition: 'all var(--transition-fast)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.5)'
                e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-glow)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            />

            {/* Email Input */}
            <input
              type="email"
              placeholder="Your email (optional — one notification only)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                height: '52px',
                padding: '0 16px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px',
                fontSize: '15px',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)',
                transition: 'all var(--transition-fast)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.5)'
                e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-glow)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            />

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !productName}
              style={{
                width: '100%',
                height: '52px',
                background: isSubmitting ? 'var(--accent-bright)' : 'var(--accent)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '15px',
                fontWeight: 500,
                fontFamily: 'var(--font-body)',
                cursor: isSubmitting || !productName ? 'not-allowed' : 'pointer',
                transition: 'background var(--transition-fast)',
                opacity: isSubmitting || !productName ? 0.6 : 1,
              }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit product request'}
            </button>
          </form>
        )}

        <p
          style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            textAlign: 'center',
            marginTop: '24px',
          }}
        >
          We send one notification email, nothing else. No account created. No password.
        </p>
      </div>
    </section>
  )
}
