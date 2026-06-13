'use client'

import { useEffect, useRef, useState } from 'react'
import { AlertCircle } from 'lucide-react'

interface EarlyVerdictCardProps {
  productName: string
  category: string
  brand: string
  trustScore: number
  confidenceTier: string
  summary: string
  pros: Array<{ text: string; mentions: number }>
  cons: Array<{ text: string; mentions: number }>
  amazonCount: number
  youtubeCount: number
  dataPoints: number
  locale: string
}

export default function EarlyVerdictCard({
  productName,
  category,
  brand,
  trustScore,
  confidenceTier,
  summary,
  pros,
  cons,
  amazonCount,
  youtubeCount,
  dataPoints,
  locale,
}: EarlyVerdictCardProps) {
  const [isVisible, setIsVisible] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.15 }
    )

    if (cardRef.current) {
      observer.observe(cardRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section
      style={{
        padding: '36px 40px 48px',
        background: 'var(--bg)',
      }}
      className="px-5 sm:px-8"
    >
      <div className="container" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Warning Alert */}
        <div
          style={{
            background: 'rgba(217, 119, 6, 0.08)',
            border: '1px solid rgba(217, 119, 6, 0.3)',
            borderRadius: '10px',
            padding: '16px',
            marginBottom: '32px',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start',
          }}
        >
          <AlertCircle size={20} color="var(--amber)" style={{ marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--amber)' }}>
              ⚠️ Early Verdict — Limited Data
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              This verdict is based on {dataPoints} reviews. As more reviews come in over the next 2 weeks, this verdict will become more accurate.
            </div>
          </div>
        </div>

        {/* Verdict Card */}
        <div
          ref={cardRef}
          style={{
            maxWidth: '860px',
            margin: '0 auto',
            background: 'var(--surface-1)',
            border: '1px solid var(--border)',
            borderTop: '3px solid var(--amber)',
            borderRadius: '14px',
            overflow: 'hidden',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateX(0)' : 'translateX(40px)',
            transition: 'all 0.5s ease 0.3s',
          }}
        >
          {/* Card Header */}
          <div
            style={{
              padding: '28px',
              borderBottom: '1px solid var(--border)',
              display: 'grid',
              gridTemplateColumns: 'auto 1fr 130px',
              gap: '20px',
              alignItems: 'start',
            }}
          >
            {/* Product Image */}
            <div
              style={{
                width: '72px',
                height: '72px',
                background: 'var(--surface-2)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
              }}
            >
              📦
            </div>

            {/* Product Info */}
            <div>
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--accent)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  marginBottom: '6px',
                  fontWeight: 500,
                }}
              >
                {category} · {brand}
              </div>
              <h3
                style={{
                  fontSize: '22px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '6px',
                }}
              >
                {productName}
              </h3>
              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                }}
              >
                Based on {dataPoints} reviews · Early verdict
                <span
                  style={{
                    display: 'inline-block',
                    background: 'rgba(217, 119, 6, 0.12)',
                    border: '1px solid rgba(217, 119, 6, 0.3)',
                    color: 'var(--amber)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    marginLeft: '8px',
                    fontSize: '10px',
                  }}
                >
                  🟡 Limited Data
                </span>
              </div>
            </div>

            {/* TrustScore Block */}
            <div
              style={{
                background: '#EEEEEE',
                borderRadius: '10px',
                padding: '18px 22px',
                textAlign: 'center',
                border: '1px solid rgba(0, 0, 0, 0.12)',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  color: '#555555',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  marginBottom: '8px',
                  fontWeight: 500,
                }}
              >
                TrustScore
              </div>
              <div
                style={{
                  fontSize: '44px',
                  fontWeight: 700,
                  color: 'var(--amber)',
                  fontFamily: 'var(--font-mono)',
                  lineHeight: 1,
                }}
              >
                {trustScore}
              </div>
              <div
                style={{
                  fontSize: '20px',
                  color: '#333333',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                /10
              </div>
              <div
                style={{
                  height: '4px',
                  background: 'rgba(0, 0, 0, 0.10)',
                  borderRadius: '2px',
                  margin: '12px 0',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${(trustScore / 10) * 100}%`,
                    background: 'var(--amber)',
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--amber)',
                  fontWeight: 600,
                }}
              >
                ⚠️ Early
              </div>
            </div>
          </div>

          {/* AI Summary */}
          <div
            style={{
              padding: '20px 28px',
              background: 'rgba(217, 119, 6, 0.04)',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                color: 'var(--amber)',
                fontWeight: 600,
                textTransform: 'uppercase',
                marginBottom: '12px',
                letterSpacing: '0.1em',
              }}
            >
              ✦ Early Assessment
            </div>
            <p
              style={{
                fontSize: '15px',
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                color: 'var(--text-secondary)',
                lineHeight: '1.7',
              }}
            >
              {summary}
            </p>
            <div
              style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                marginTop: '12px',
                fontStyle: 'italic',
              }}
            >
              ℹ️ This assessment is based on early reviews. Expect updates as more reviews come in.
            </div>
          </div>

          {/* Pros and Cons */}
          <div
            style={{
              padding: '24px 28px',
              borderBottom: '1px solid var(--border)',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '32px',
            }}
          >
            {/* Pros */}
            <div>
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--green)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  marginBottom: '16px',
                  letterSpacing: '0.1em',
                }}
              >
                👍 EARLY SIGNALS
              </div>
              {pros.slice(0, 3).map((pro) => (
                <div
                  key={pro.text}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px',
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <span style={{ color: 'var(--green)', fontSize: '12px' }}>✓</span>
                  <span style={{ flex: 1 }}>{pro.text}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                    {pro.mentions}
                  </span>
                </div>
              ))}
            </div>

            {/* Cons */}
            <div>
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--red)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  marginBottom: '16px',
                  letterSpacing: '0.1em',
                }}
              >
                👎 EARLY CONCERNS
              </div>
              {cons.slice(0, 3).map((con) => (
                <div
                  key={con.text}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px',
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <span style={{ color: 'var(--red)', fontSize: '12px' }}>✗</span>
                  <span style={{ flex: 1 }}>{con.text}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                    {con.mentions}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Source Transparency */}
          <div
            style={{
              padding: '16px 28px',
              background: 'rgba(0, 0, 0, 0.02)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '11px',
              color: 'var(--text-muted)',
            }}
          >
            <div>
              🔍 {amazonCount} Amazon reviews · {youtubeCount} YouTube videos · {dataPoints} total
            </div>
            <div style={{ color: 'var(--accent)' }}>Updates coming in 1-2 weeks ↗</div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div
          style={{
            textAlign: 'center',
            marginTop: '32px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
          }}
        >
          <button
            style={{
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              padding: '12px 28px',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all var(--transition-base)',
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 8px 16px rgba(37, 99, 235, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            Search Similar →
          </button>
          <button
            style={{
              background: 'transparent',
              border: '1px solid rgba(0, 0, 0, 0.20)',
              color: 'var(--text-primary)',
              padding: '12px 28px',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all var(--transition-base)',
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent)'
              e.currentTarget.style.color = 'var(--accent)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.20)'
              e.currentTarget.style.color = 'var(--text-primary)'
            }}
          >
            Back to Search
          </button>
        </div>
      </div>
    </section>
  )
}
