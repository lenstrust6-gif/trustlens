'use client'

import SectionLabel from '../shared/SectionLabel'
import AuthScoreBar from '../shared/AuthScoreBar'
import { SAMPLE_REVIEWS } from '@/lib/home-data'

interface AuthenticicitySectionProps {
  locale: string
}

export default function AuthenticitySection({ locale }: AuthenticicitySectionProps) {
  return (
    <section
      style={{
        padding: '72px 40px 60px',
        background: 'var(--bg)',
        borderTop: '1px solid var(--border)',
      }}
      className="px-5 sm:px-8"
    >
      <div className="container" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Section Label */}
        <SectionLabel text="HOW IT WORKS" />

        {/* Main Heading */}
        <h2 style={{ marginBottom: '48px', color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
          Our 6-signal Authenticity Scoring system
        </h2>

        {/* Scoring Signals Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
            marginBottom: '64px',
          }}
        >
          {[
            { signal: 'Language Specificity', desc: 'Real reviews use specific product details, not generic praise' },
            { signal: 'Reviewer History', desc: 'Long-term reviewers with consistent patterns are more trustworthy' },
            { signal: 'Sentiment Coherence', desc: 'Genuine opinions balance criticism with praise' },
            { signal: 'Timing Patterns', desc: 'Authentic reviews spread naturally, not in suspicious bursts' },
            { signal: 'Cross-platform Uniqueness', desc: 'Same reviews on multiple platforms signal inauthenticity' },
            { signal: 'Incentivized Language', desc: 'AI detects sponsored/paid review markers' },
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                background: 'var(--surface-1)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '20px',
              }}
            >
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>
                {['🔤', '👤', '⚖️', '⏱️', '🌐', '🤖'][idx]}
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                {item.signal}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Two Column Layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '60% 40%',
            gap: '60px',
            alignItems: 'start',
          }}
          className="grid-cols-1 lg:grid-cols-2"
        >
          {/* Left Column */}
          <div>
            <SectionLabel text="THE AUTHENTICITY SCORE" />
            <h2 style={{ marginBottom: '20px', color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
              We never call a review fake.
              <br />
              We score how trustworthy it is.
            </h2>

            <p
              style={{
                fontSize: '16px',
                color: 'var(--text-secondary)',
                lineHeight: '1.75',
                marginBottom: '20px',
              }}
            >
              Every review runs through our 6-signal Authenticity Score (0–100).
              Language specificity. Reviewer history. Sentiment coherence. Timing
              patterns. Cross-platform uniqueness. Incentivised language detection.
            </p>

            <p
              style={{
                fontSize: '16px',
                color: 'var(--text-secondary)',
                lineHeight: '1.75',
                marginBottom: '20px',
              }}
            >
              Reviews scoring below 40 are excluded entirely. Reviews scoring 40–69
              count at half weight. Only scores above 70 get full weight.
            </p>

            <p
              style={{
                fontSize: '16px',
                color: 'var(--text-secondary)',
                lineHeight: '1.75',
              }}
            >
              We never say "fake review" — that's a legal claim we cannot prove. We
              say "Authenticity Score: 34/100" — and show you exactly which signals
              triggered it.
            </p>

            <a
              href={`/${locale}/methodology`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '24px',
                fontSize: '14px',
                color: 'var(--accent)',
                textDecoration: 'none',
                transition: 'gap var(--transition-base)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.gap = '12px'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.gap = '8px'
              }}
            >
              Read our full scoring methodology
              <span>↗</span>
            </a>
          </div>

          {/* Right Column - Review Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {SAMPLE_REVIEWS.map((review, idx) => (
              <div
                key={review.id}
                style={{
                  background: 'var(--surface-1)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '16px',
                }}
              >
                {/* Source Badge */}
                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--amber)',
                    fontWeight: 600,
                    marginBottom: '8px',
                  }}
                >
                  {review.source}
                </div>

                {/* Stars */}
                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--amber)',
                    marginBottom: '8px',
                  }}
                >
                  {'★'.repeat(review.stars)}{'☆'.repeat(5 - review.stars)}
                </div>

                {/* Excerpt */}
                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    fontStyle: 'italic',
                    marginBottom: '12px',
                    lineHeight: '1.6',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  "{review.excerpt}"
                </p>

                {/* Auth Score Bar */}
                <AuthScoreBar
                  score={review.authScore}
                  delay={idx * 200}
                  animated={true}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
