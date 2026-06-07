'use client'

import Link from 'next/link'

interface HomeFooterProps {
  locale: string
}

export default function HomeFooter({ locale }: HomeFooterProps) {
  return (
    <footer
      style={{
        padding: '60px 40px 40px',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg)',
      }}
      className="px-5 sm:px-8"
    >
      <div
        className="container"
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '40px',
          marginBottom: '48px',
        }}
      >
        {/* Column 1: Brand */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '12px',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                background: 'var(--accent)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '16px',
                fontWeight: 'bold',
              }}
            >
              ✓
            </div>
            <span
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--text-primary)',
              }}
            >
              TrustLens
            </span>
          </div>
          <p
            style={{
              fontSize: '13px',
              color: 'var(--text-muted)',
              marginBottom: '4px',
            }}
          >
            Real reviews. Trusted verdicts.
          </p>
          <p
            style={{
              fontSize: '13px',
              color: 'var(--text-muted)',
              marginBottom: '4px',
            }}
          >
            Built for India. Powered by AI.
          </p>
          <p
            style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              marginTop: '16px',
            }}
          >
            🇮🇳 India · Amazon.in + YouTube
          </p>
        </div>

        {/* Column 2: Product */}
        <div>
          <div
            style={{
              fontSize: '10px',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '16px',
              fontWeight: 600,
            }}
          >
            PRODUCT
          </div>
          <nav
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <a
              href="#how-it-works"
              style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                transition: 'color var(--transition-base)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-primary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)'
              }}
            >
              How it works
            </a>
            <a
              href="#categories"
              style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                transition: 'color var(--transition-base)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-primary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)'
              }}
            >
              Browse categories
            </a>
            <Link
              href={`/${locale}/submit`}
              style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                transition: 'color var(--transition-base)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-primary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)'
              }}
            >
              Submit a product
            </Link>
            <Link
              href={`/${locale}/methodology`}
              style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                transition: 'color var(--transition-base)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-primary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)'
              }}
            >
              Methodology
            </Link>
          </nav>
        </div>

        {/* Column 3: Trust */}
        <div>
          <div
            style={{
              fontSize: '10px',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '16px',
              fontWeight: 600,
            }}
          >
            TRUST
          </div>
          <nav
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <Link
              href={`/${locale}/methodology`}
              style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                transition: 'color var(--transition-base)',
              }}
            >
              Auth Score explained
            </Link>
            <a
              href="#"
              style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                transition: 'color var(--transition-base)',
              }}
            >
              Data sources
            </a>
            <a
              href="#"
              style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                transition: 'color var(--transition-base)',
              }}
            >
              Privacy policy
            </a>
            <a
              href="#"
              style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                transition: 'color var(--transition-base)',
              }}
            >
              DPDP compliance
            </a>
          </nav>
        </div>

        {/* Column 4: Ethos */}
        <div>
          <div
            style={{
              fontSize: '10px',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '16px',
              fontWeight: 600,
            }}
          >
            ETHOS
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              fontSize: '14px',
              color: 'var(--text-secondary)',
            }}
          >
            <p>No ads. Ever.</p>
            <p>No sponsored results.</p>
            <p>No paid placements.</p>
            <p>Just honest verdicts.</p>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div
        style={{
          borderTop: '1px solid var(--border)',
          paddingTop: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          fontSize: '12px',
          color: 'var(--text-muted)',
        }}
      >
        <p>© 2026 TrustLens</p>
        <p>Data: YouTube API + Amazon.in · AI: Gemma 3 12B + Claude Sonnet</p>
      </div>
    </footer>
  )
}
