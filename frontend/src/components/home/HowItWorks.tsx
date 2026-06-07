'use client'

import { useEffect, useRef, useState } from 'react'
import SectionLabel from '../shared/SectionLabel'
import Card from '../shared/Card'
import Badge from '../shared/Badge'
import { STEPS } from '@/lib/home-data'
import {
  Download,
  Filter,
  ShieldCheck,
  FileText,
  ArrowRight,
  ArrowDown,
} from 'lucide-react'

const ICON_MAP: Record<string, React.ReactNode> = {
  Download: <Download size={24} />,
  Filter: <Filter size={24} />,
  ShieldCheck: <ShieldCheck size={24} />,
  FileText: <FileText size={24} />,
}

const COLOR_MAP: Record<string, string> = {
  green: 'var(--green)',
  amber: 'var(--amber)',
  muted: 'var(--text-muted)',
  accent: 'var(--accent)',
}

interface HowItWorksProps {
  locale: string
}

export default function HowItWorks({ locale }: HowItWorksProps) {
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set())
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const observers = cardRefs.current.map((ref, idx) => {
      if (!ref) return null

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisibleCards((prev) => new Set(prev).add(idx))
          }
        },
        { threshold: 0.15 }
      )

      observer.observe(ref)
      return observer
    })

    return () => {
      observers.forEach((observer) => observer?.disconnect())
    }
  }, [])

  return (
    <section
      id="how-it-works"
      style={{
        padding: '60px 40px',
        background: 'var(--bg)',
      }}
      className="px-5 sm:px-8"
    >
      <div className="container" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Section Label + Title */}
        <SectionLabel text="HOW IT WORKS" />
        <h2
          style={{
            marginBottom: '60px',
            color: 'var(--text-primary)',
          }}
        >
          From raw reviews to trusted verdict in under 45 seconds.
        </h2>

        {/* Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
            position: 'relative',
          }}
        >
          {STEPS.map((step, idx) => (
            <div key={step.id} style={{ position: 'relative' }}>
              {/* Connecting Arrow (Desktop) */}
              {idx < STEPS.length - 1 && (
                <div
                  style={{
                    position: 'absolute',
                    right: '-28px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    display: 'none',
                  }}
                  className="hidden lg:block"
                >
                  <ArrowRight
                    size={16}
                    color="var(--text-muted)"
                    style={{ opacity: 0.5 }}
                  />
                </div>
              )}

              {/* Card */}
              <div
                ref={(el) => {
                  cardRefs.current[idx] = el
                }}
                style={{
                  opacity: visibleCards.has(idx) ? 1 : 0,
                  transform: visibleCards.has(idx)
                    ? 'translateY(0)'
                    : 'translateY(40px)',
                  transition: `all 0.5s ease ${idx * 150}ms`,
                }}
              >
                <Card>
                  {/* Step Number */}
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      marginBottom: '12px',
                      fontFamily: 'var(--font-mono)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                    }}
                  >
                    {String(step.id).padStart(2, '0')}
                  </div>

                  {/* Icon */}
                  <div
                    style={{
                      fontSize: '24px',
                      marginBottom: '10px',
                      color: COLOR_MAP[step.color],
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {ICON_MAP[step.icon]}
                  </div>

                  {/* Title */}
                  <h3
                    style={{
                      fontSize: '15px',
                      fontWeight: 600,
                      marginBottom: '12px',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p
                    style={{
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                      lineHeight: '1.6',
                      marginBottom: '16px',
                      minHeight: '60px',
                    }}
                  >
                    {step.description}
                  </p>

                  {/* Badge */}
                  <Badge variant="default">
                    {step.badge}
                  </Badge>
                </Card>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
