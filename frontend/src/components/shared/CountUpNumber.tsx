'use client'

import { useState, useEffect, useRef } from 'react'

interface CountUpNumberProps {
  target: number
  duration?: number
  prefix?: string
  suffix?: string
  format?: (value: number) => string
  className?: string
}

export default function CountUpNumber({
  target,
  duration = 1500,
  prefix = '',
  suffix = '',
  format,
  className = '',
}: CountUpNumberProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const elementRef = useRef<HTMLSpanElement>(null)
  const animationStartedRef = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animationStartedRef.current) {
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
  }, [])

  useEffect(() => {
    if (!isVisible) return

    let animationFrameId: number
    const startTime = Date.now()

    const easeOutExpo = (t: number) => {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
    }

    const animate = () => {
      const now = Date.now()
      const elapsed = Math.min(now - startTime, duration)
      const progress = elapsed / duration
      const easeProgress = easeOutExpo(progress)

      const currentValue = Math.floor(target * easeProgress)
      setDisplayValue(currentValue)

      if (elapsed < duration) {
        animationFrameId = requestAnimationFrame(animate)
      }
    }

    animationFrameId = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationFrameId)
  }, [isVisible, target, duration])

  const formattedValue = format
    ? format(displayValue)
    : `${prefix}${displayValue.toLocaleString()}${suffix}`

  return (
    <span ref={elementRef} className={className}>
      {formattedValue}
    </span>
  )
}
