'use client'

import { useEffect, useRef, useState } from 'react'
import SectionLabel from '../shared/SectionLabel'
import AuthScoreBar from '../shared/AuthScoreBar'
import { FEATURES, PROS, CONS } from '@/lib/home-data'

interface VerdictPreviewProps {
  locale: string
}

export default function VerdictPreview({ locale }: VerdictPreviewProps) {
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

  const getFeatureColor = (score: number) => {
    if (score >= 7.5) return 'var(--green)'
    if (score >= 5) return 'var(--amber)'
    return 'var(--red)'
  }

  const getFeaturePercent = (score: number) => (score / 10) * 100

  return (
    <section
      id="verdict-preview"
      style={{
        padding: '36px 40px 48px',
        background: 'var(--bg)',
      }}
      className="px-5 sm:px-8"
    >
      <div className="container" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Section Label + Title */}
        <SectionLabel text="WHAT YOU GET" />
        <h2 style={{ marginBottom: '60px', color: 'var(--text-primary)' }}>
          One search. A verdict you can actually use.
        </h2>

        {/* Verdict Card */}
        <div
          ref={cardRef}
          style={{
            maxWidth: '860px',
            margin: '0 auto',
            background: 'var(--surface-1)',
            border: '1px solid var(--border)',
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
              🎧
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
                True Wireless Earbuds · boAt
              </div>
              <h3
                style={{
                  fontSize: '22px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '6px',
                }}
              >
                boAt Airdopes 141
              </h3>
              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                }}
              >
                Based on 634 reviews · Updated 2 days ago{' '}
                <span
                  style={{
                    display: 'inline-block',
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    color: 'var(--amber)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    marginLeft: '8px',
                    fontSize: '10px',
                  }}
                >
                  🟡 Growing Verdict
                </span>
              </div>
            </div>

            {/* TrustScore Block */}
            <div
              style={{
                background: '#F0F4F8',
                borderRadius: '10px',
                padding: '18px 22px',
                textAlign: 'center',
                border: '1px solid rgba(0, 0, 0, 0.08)',
              }}
            >
              <div
                style={{
                  fontSize: '9px',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  marginBottom: '8px',
                }}
              >
                TrustScore
              </div>
              <div
                style={{
                  fontSize: '44px',
                  fontWeight: 700,
                  color: 'var(--accent)',
                  fontFamily: 'var(--font-mono)',
                  lineHeight: 1,
                }}
              >
                8.1
              </div>
              <div
                style={{
                  fontSize: '20px',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                /10
              </div>
              <div
                style={{
                  height: '4px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '2px',
                  margin: '12px 0',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: '81%',
                    background: 'var(--accent)',
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--green)',
                  fontWeight: 600,
                }}
              >
                ✓ Recommended
              </div>
            </div>
          </div>

          {/* AI Summary */}
          <div
            style={{
              padding: '20px 28px',
              background: 'rgba(37, 99, 235, 0.04)',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                color: 'var(--accent)',
                fontWeight: 600,
                textTransform: 'uppercase',
                marginBottom: '12px',
                letterSpacing: '0.1em',
              }}
            >
              ✦ AI Verdict
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
              The boAt Airdopes 141 earns its reputation as India's go-to budget TWS
              under ₹1,500. Bass-heavy sound signature with solid connectivity and
              genuine all-day battery performance confirmed across hundreds of reviews.
              Call quality is acceptable but not its strength. For commuting, gym use,
              and everyday listening at this price, very few rivals match it.
            </p>
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
                👍 TOP PROS
              </div>
              {PROS.map((pro) => (
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
                👎 TOP CONS
              </div>
              {CONS.map((con) => (
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

          {/* Feature Scores */}
          <div
            style={{
              padding: '24px 28px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                marginBottom: '16px',
                letterSpacing: '0.1em',
                fontWeight: 500,
              }}
            >
              📊 FEATURE SCORES
            </div>
            {FEATURES.map((feature) => (
              <div
                key={feature.name}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '140px 1fr 44px',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '7px 0',
                }}
              >
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {feature.name}
                </div>
                <div
                  style={{
                    height: '5px',
                    background: 'rgba(255, 255, 255, 0.07)',
                    borderRadius: '3px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${getFeaturePercent(feature.score)}%`,
                      background: getFeatureColor(feature.score),
                      borderRadius: '3px',
                    }}
                  />
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    fontFamily: 'var(--font-mono)',
                    color: getFeatureColor(feature.score),
                  }}
                >
                  {feature.score.toFixed(1)}
                </div>
              </div>
            ))}
          </div>

          {/* Source Transparency */}
          <div
            style={{
              padding: '16px 28px',
              background: 'rgba(255, 255, 255, 0.015)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '11px',
              color: 'var(--text-muted)',
            }}
          >
            <div>
              🔍 312 Amazon.in reviews · 322 YouTube comments · Auth avg: 71/100 · 89
              excluded
            </div>
            <div style={{ color: 'var(--accent)' }}>View sources ↗</div>
          </div>
        </div>

        {/* CTA Button */}
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <button
            style={{
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.20)',
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
              e.currentTarget.style.borderColor = 'var(--border-hover)'
              e.currentTarget.style.color = 'var(--text-primary)'
            }}
          >
            Search for your product →
          </button>
        </div>
      </div>
    </section>
  )
}
