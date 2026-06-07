'use client'

import { useState, useEffect, useRef } from 'react'

interface AuthScoreBarProps {
  score: number
  animated?: boolean
  delay?: number
  className?: string
}

export default function AuthScoreBar({
  score,
  animated = true,
  delay = 0,
  className = '',
}: AuthScoreBarProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)
  const animationStartedRef = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animationStartedRef.current && animated) {
          animationStartedRef.current = true
          setIsVisible(true)
        }
      },
      { threshold: 0.15 }
    )

    if (elementRef.current) {
      observer.observe(elementRef.current)
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current)
      }
    }
  }, [animated])

  useEffect(() => {
    if (!isVisible && !animated) {
      setDisplayValue(score)
      return
    }

    if (!isVisible) return

    let animationFrameId: number
    const startTime = Date.now() + delay
    const duration = 800

    const easeOutQuad = (t: number) => t * (2 - t)

    const animate = () => {
      const now = Date.now()

      if (now < startTime) {
        animationFrameId = requestAnimationFrame(animate)
        return
      }

      const elapsed = Math.min(now - startTime, duration)
      const progress = elapsed / duration
      const easeProgress = easeOutQuad(progress)

      const currentValue = Math.floor(score * easeProgress)
      setDisplayValue(currentValue)

      if (elapsed < duration) {
        animationFrameId = requestAnimationFrame(animate)
      } else {
        setDisplayValue(score)
      }
    }

    animationFrameId = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationFrameId)
  }, [isVisible, score, delay, animated])

  // Determine color based on score
  const getColor = () => {
    if (displayValue < 40) return 'var(--red)'
    if (displayValue < 70) return 'var(--amber)'
    return 'var(--green)'
  }

  const getStatus = () => {
    if (score < 40) return '✗ Excluded'
    if (score < 70) return '~ Reduced weight'
    return '✓ Full weight'
  }

  const getStatusColor = () => {
    if (score < 40) return 'var(--red)'
    if (score < 70) return 'var(--amber)'
    return 'var(--green)'
  }

  const fillPercentage = (displayValue / 100) * 100

  return (
    <div
      ref={elementRef}
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      {/* Bar */}
      <div
        style={{
          height: '4px',
          background: 'rgba(255, 255, 255, 0.07)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${fillPercentage}%`,
            background: getColor(),
            borderRadius: '2px',
            transition: 'width 0.1s ease',
          }}
        />
      </div>

      {/* Score and Status Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontSize: '13px',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {displayValue}/100
        </span>
        <span
          style={{
            fontSize: '11px',
            color: getStatusColor(),
            fontWeight: 600,
          }}
        >
          {getStatus()}
        </span>
      </div>
    </div>
  )
}
