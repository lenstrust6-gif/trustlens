'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import SearchBar from '../shared/SearchBar'
import CountUpNumber from '../shared/CountUpNumber'
import GlowGradient from '../shared/GlowGradient'
import { QUICK_PILLS } from '@/lib/home-data'

interface HeroSectionProps {
  locale: string
}

export default function HeroSection({ locale }: HeroSectionProps) {
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handlePillClick = (pill: string) => {
    // Navigate directly to search with the pill text as query
    router.push(`/${locale}/search?q=${encodeURIComponent(pill)}`)
  }

  return (
    <section
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        position: 'relative',
        paddingTop: '120px',
        paddingBottom: '60px',
        paddingLeft: '40px',
        paddingRight: '40px',
        background: 'var(--bg)',
        overflow: 'hidden',
      }}
      className="px-5 sm:px-8 lg:px-10"
    >
      {/* Glow Background */}
      <GlowGradient
        position={{ x: '50%', y: '60%' }}
        size={{ width: '900px', height: '500px' }}
      />

      {/* Dot Grid Background (CSS) */}
      <style>{`
        section::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(circle, rgba(0,0,0,0.04) 1px, transparent 1px);
          background-size: 32px 32px;
          pointer-events: none;
          z-index: 1;
        }
      `}</style>

      {/* Content Container */}
      <div
        style={{
          maxWidth: '760px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* Main Headline */}
        {mounted && (
          <h1
            style={{
              marginTop: '32px',
              animation: `fadeUp 0.5s ease ${0.2}s both`,
            }}
          >
            <span style={{ display: 'block' }}>Stop trusting</span>
            <span
              style={{
                fontStyle: 'italic',
                color: 'var(--accent)',
              }}
            >
              fake reviews.
            </span>
          </h1>
        )}

        {/* Subtitle */}
        {mounted && (
          <p
            style={{
              marginTop: '24px',
              animation: `fadeUp 0.5s ease ${0.35}s both`,
              maxWidth: '520px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            TrustLens analyses thousands of real YouTube comments and Amazon.in reviews,
            scores their authenticity with AI, and gives you a verdict you can actually
            trust.
          </p>
        )}

        {/* Search Bar */}
        {mounted && (
          <div
            style={{
              marginTop: '48px',
              animation: `fadeUp 0.5s ease ${0.45}s both`,
              maxWidth: '600px',
              width: '100%',
              margin: '48px auto 0',
            }}
          >
            <SearchBar locale={locale} />
          </div>
        )}

        {/* Quick Search Pills */}
        {mounted && (
          <div
            style={{
              marginTop: '16px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              alignItems: 'center',
              justifyContent: 'center',
              animation: `fadeUp 0.5s ease ${0.6}s both`,
            }}
          >
            <span
              style={{
                fontSize: '13px',
                color: 'var(--text-muted)',
                marginRight: '4px',
              }}
            >
              Try:
            </span>
            {QUICK_PILLS.map((pill, idx) => (
              <button
                key={pill}
                onClick={() => handlePillClick(pill)}
                style={{
                  background: 'rgba(0, 0, 0, 0.04)',
                  border: '1px solid var(--border)',
                  padding: '5px 12px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  animation: `fadeUp 0.4s ease ${0.6 + idx * 0.05}s both`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.5)'
                  e.currentTarget.style.background = 'rgba(37, 99, 235, 0.10)'
                  e.currentTarget.style.color = 'var(--text-primary)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.04)'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }}
              >
                {pill}
              </button>
            ))}
          </div>
        )}

        {/* Trust Stats Bar */}
        {mounted && (
          <div
            style={{
              marginTop: '40px',
              borderTop: '1px solid var(--border)',
              borderBottom: '1px solid var(--border)',
              background: 'rgba(0, 0, 0, 0.02)',
              padding: '20px 0',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '1px',
              animation: `fadeUp 0.5s ease ${0.75}s both`,
            }}
          >
            {[
              { number: 48200, label: 'Reviews Analysed' },
              { number: 340, label: 'Products Scored' },
              { number: 78, label: 'Avg Auth Score', suffix: '/100' },
              { number: 45, label: '< Seconds', suffix: '', prefix: '< ' },
            ].map((stat, idx) => (
              <div
                key={idx}
                style={{
                  textAlign: 'center',
                  paddingRight: idx < 3 ? '20px' : 0,
                  borderRight: idx < 3 ? '1px solid rgba(0, 0, 0, 0.12)' : 'none',
                }}
              >
                <div
                  style={{
                    fontSize: '28px',
                    fontWeight: 500,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-primary)',
                    marginBottom: '4px',
                  }}
                >
                  <CountUpNumber
                    target={stat.number}
                    suffix={stat.suffix || ''}
                    prefix={stat.prefix || ''}
                  />
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
