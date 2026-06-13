'use client'

import SectionLabel from '../shared/SectionLabel'

interface Testimonial {
  quote: string
  author: string
  context: string
  emoji: string
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote: "Finally found a trustworthy place to check product reviews. No more dealing with fake ratings on Amazon.",
    author: "Priya M.",
    context: "Saved ₹8,000 by avoiding a low-quality smartwatch",
    emoji: "✅",
  },
  {
    quote: "The authenticity scoring is brilliant. I can actually trust the verdicts instead of wading through 10,000 reviews.",
    author: "Rahul K.",
    context: "Now buys premium headphones with confidence",
    emoji: "🎯",
  },
  {
    quote: "Best part? It combines YouTube AND Amazon reviews. Gets the real picture that individual platforms hide.",
    author: "Sneha D.",
    context: "Switched from single-platform research",
    emoji: "🔍",
  },
  {
    quote: "The Hindi YouTube reviews make all the difference. Now my parents can find genuine product opinions too.",
    author: "Amit P.",
    context: "Family shopping decisions made easier",
    emoji: "🌍",
  },
]

export default function TestimonialsSection({ locale }: { locale: string }) {
  return (
    <section
      style={{
        padding: '72px 40px 60px',
        background: 'var(--bg)',
      }}
      className="px-5 sm:px-8"
    >
      <div className="container" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Section Label + Title */}
        <SectionLabel text="TRUSTED BY THOUSANDS" />
        <h2 style={{ marginBottom: '48px', color: 'var(--text-primary)' }}>
          What real users say about TrustLens
        </h2>

        {/* Testimonials Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
          }}
        >
          {TESTIMONIALS.map((testimonial, idx) => (
            <div
              key={idx}
              style={{
                background: 'var(--surface-1)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '28px',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all var(--transition-base)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.borderColor = 'var(--border)'
              }}
            >
              {/* Quote Mark + Emoji */}
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>
                {testimonial.emoji}
              </div>

              {/* Quote */}
              <p
                style={{
                  fontSize: '15px',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.8',
                  marginBottom: '16px',
                  fontStyle: 'italic',
                  flex: 1,
                }}
              >
                "{testimonial.quote}"
              </p>

              {/* Author */}
              <div style={{ marginBottom: '8px' }}>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}
                >
                  {testimonial.author}
                </div>
              </div>

              {/* Context */}
              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                }}
              >
                {testimonial.context}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
