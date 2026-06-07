'use client'

import Card from '../shared/Card'
import { VERDICTS } from '@/lib/home-data'

interface CompetitorContextProps {
  locale: string
}

export default function CompetitorContext({ locale }: CompetitorContextProps) {
  return (
    <section
      style={{
        padding: '50px 40px',
        background: 'var(--bg)',
        borderTop: '1px solid var(--border)',
      }}
      className="px-5 sm:px-8"
    >
      <div className="container" style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '32px' }}>
          The tools you relied on are gone.
        </h2>

        <p
          style={{
            fontSize: '16px',
            color: 'var(--text-secondary)',
            lineHeight: '1.7',
            textAlign: 'center',
            marginBottom: '60px',
            maxWidth: '600px',
            margin: '0 auto 60px',
          }}
        >
          Fakespot shut down on July 1, 2025. ReviewMeta went offline in early 2026.
          No replacement exists that covers Amazon.in, processes Hindi YouTube reviews,
          and delivers a verdict — not just a warning letter grade.
          <br />
          <br />
          That is exactly what TrustLens was built to do.
        </p>

        {/* Comparison Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '14px',
          }}
        >
          {VERDICTS.map((verdict, idx) => (
            <Card
              key={verdict.title}
              featured={verdict.featured}
              style={{
                opacity: 1,
                transform: 'translateY(0)',
                transition: `all 0.5s ease ${idx * 150}ms`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                }}
              >
                <h3
                  style={{
                    fontSize: '15px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}
                >
                  {verdict.title}
                </h3>
                <div
                  style={{
                    fontSize: '11px',
                    padding: '4px 10px',
                    background:
                      verdict.featured
                        ? 'rgba(16, 185, 129, 0.12)'
                        : 'rgba(239, 68, 68, 0.12)',
                    border: `1px solid ${
                      verdict.featured
                        ? 'rgba(16, 185, 129, 0.3)'
                        : 'rgba(239, 68, 68, 0.3)'
                    }`,
                    borderRadius: '4px',
                    color: verdict.featured ? 'var(--green)' : 'var(--red)',
                    fontWeight: 600,
                  }}
                >
                  {verdict.status}
                </div>
              </div>

              {/* Bullets */}
              {verdict.bullets.map((bullet) => (
                <div
                  key={bullet}
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-muted)',
                    marginBottom: '8px',
                    paddingLeft: '12px',
                    borderLeft: `1px solid var(--border)`,
                  }}
                >
                  • {bullet}
                </div>
              ))}

              {/* Footer */}
              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  marginTop: '16px',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--border)',
                  fontStyle: 'italic',
                }}
              >
                {verdict.footer}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
