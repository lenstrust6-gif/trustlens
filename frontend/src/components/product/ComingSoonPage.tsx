'use client'

import { useState } from 'react'
import { Clock, AlertCircle } from 'lucide-react'

interface ComingSoonPageProps {
  productName: string
  category: string
  amazonReviewCount: number
  youtubeVideoCount: number
  detectedDaysAgo: number
  onEmailCapture?: (email: string) => Promise<void>
}

export default function ComingSoonPage({
  productName,
  category,
  amazonReviewCount,
  youtubeVideoCount,
  detectedDaysAgo,
  onEmailCapture,
}: ComingSoonPageProps) {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email')
      return
    }

    setLoading(true)
    setError('')
    try {
      if (onEmailCapture) {
        await onEmailCapture(email)
      }
      setSubmitted(true)
      setEmail('')
      setTimeout(() => setSubmitted(false), 5000)
    } catch (error) {
      console.error('Error capturing email:', error)
      setError('Failed to save email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const combined = amazonReviewCount + youtubeVideoCount
  const targetForEarly = 25
  const progressPercent = Math.min((combined / targetForEarly) * 100, 100)

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        padding: '60px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      className="px-5 sm:px-8"
    >
      <div
        style={{
          maxWidth: '600px',
          width: '100%',
        }}
      >
        {/* Icon */}
        <div
          style={{
            fontSize: '64px',
            marginBottom: '24px',
            textAlign: 'center',
          }}
        >
          🆕
        </div>

        {/* Heading */}
        <h1
          style={{
            fontSize: '36px',
            fontWeight: 400,
            color: 'var(--text-primary)',
            marginBottom: '12px',
            textAlign: 'center',
            fontFamily: 'var(--font-display)',
          }}
        >
          {productName}
        </h1>

        {/* Subheading */}
        <p
          style={{
            fontSize: '16px',
            color: 'var(--text-secondary)',
            textAlign: 'center',
            marginBottom: '40px',
          }}
        >
          {category} · Launched {detectedDaysAgo} {detectedDaysAgo === 1 ? 'day' : 'days'} ago
        </p>

        {/* Status Box */}
        <div
          style={{
            background: 'rgba(37, 99, 235, 0.05)',
            border: '1px solid rgba(37, 99, 235, 0.2)',
            borderRadius: '12px',
            padding: '28px',
            marginBottom: '32px',
          }}
        >
          {/* Status Message */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '24px',
            }}
          >
            <Clock size={24} color="var(--accent)" />
            <div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}
              >
                ⏳ Verdict Generating
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                We've detected this product and are collecting authentic reviews
              </div>
            </div>
          </div>

          {/* Data Progress */}
          <div style={{ marginBottom: '24px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
                fontSize: '13px',
              }}
            >
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                Review Data Collected
              </span>
              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                {combined} / {25} required
              </span>
            </div>

            {/* Progress Bar */}
            <div
              style={{
                height: '6px',
                background: 'rgba(0, 0, 0, 0.08)',
                borderRadius: '3px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progressPercent}%`,
                  background: 'linear-gradient(90deg, var(--accent), #1D4ED8)',
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
          </div>

          {/* Data Breakdown */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
            }}
          >
            <div
              style={{
                background: 'var(--surface-1)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '12px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent)' }}>
                {amazonReviewCount}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Amazon Reviews
              </div>
            </div>

            <div
              style={{
                background: 'var(--surface-1)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '12px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent)' }}>
                {youtubeVideoCount}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                YouTube Videos
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div style={{ marginBottom: '32px' }}>
          <h3
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '12px',
            }}
          >
            Expected Timeline
          </h3>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
            <div style={{ marginBottom: '8px' }}>
              📊 <strong>7–14 days:</strong> Early verdict based on limited reviews
            </div>
            <div>
              ✅ <strong>2–3 weeks:</strong> Full detailed verdict with all sections
            </div>
          </div>
        </div>

        {/* Email Capture */}
        <div style={{ marginBottom: '32px' }}>
          <h3
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '12px',
            }}
          >
            Get Notified When Ready
          </h3>

          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                flex: 1,
                padding: '12px 16px',
                background: 'var(--surface-1)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                fontSize: '14px',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)',
                transition: 'all var(--transition-base)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent)'
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.08)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
            <button
              type="submit"
              disabled={!email || loading || submitted}
              style={{
                padding: '12px 24px',
                background: submitted ? 'var(--green)' : 'var(--accent)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all var(--transition-base)',
                opacity: loading || submitted ? 0.8 : 1,
              }}
              onMouseEnter={(e) => {
                if (!loading && !submitted) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(37, 99, 235, 0.3)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {loading ? '...' : submitted ? '✓ Sent!' : 'Notify Me'}
            </button>
          </form>

          {submitted && (
            <div
              style={{
                marginTop: '12px',
                fontSize: '13px',
                color: 'var(--green)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              ✓ We'll email you when the verdict is ready!
            </div>
          )}

          {error && (
            <div
              style={{
                marginTop: '12px',
                fontSize: '13px',
                color: 'var(--red)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.02)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '16px',
            fontSize: '12px',
            color: 'var(--text-muted)',
            textAlign: 'center',
          }}
        >
          💡 TrustLens reviews products from real YouTube comments and Amazon reviews. New products typically get their first verdict in 1–2 weeks.
        </div>
      </div>
    </div>
  )
}
