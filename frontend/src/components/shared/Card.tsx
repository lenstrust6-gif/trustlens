import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'featured' | 'elevated'
  href?: string
  featured?: boolean
  style?: React.CSSProperties
  borderBrighter?: boolean
}

export default function Card({
  children,
  className = '',
  variant = 'default',
  href,
  featured = false,
  style,
  borderBrighter = false,
}: CardProps) {
  const baseStyle = {
    background: 'var(--surface-1)',
    border: borderBrighter ? '1px solid rgba(255,255,255,0.10)' : '1px solid var(--border)',
    borderRadius: '10px',
    padding: 'var(--space-lg)',
    transition: 'all var(--transition-slow)',
    cursor: href ? 'pointer' : 'default',
  }

  const variantStyles = {
    default: {},
    featured: {
      borderColor: 'rgba(37, 99, 235, 0.2)',
      background: 'rgba(37, 99, 235, 0.05)',
    },
    elevated: {
      background: 'var(--surface-2)',
    },
  }

  const hoverStyle = {
    borderColor: 'var(--border-hover)',
    transform: 'translateY(-2px)',
  }

  const combinedStyle = {
    ...baseStyle,
    ...variantStyles[variant],
    ...(featured && variantStyles.featured),
    ...style,
  }

  const element = (
    <div
      className={className}
      style={combinedStyle}
      onMouseEnter={(e) => {
        if (href) {
          Object.assign(e.currentTarget.style, hoverStyle)
        }
      }}
      onMouseLeave={(e) => {
        if (href) {
          Object.assign(e.currentTarget.style, {
            borderColor: 'var(--border)',
            transform: 'translateY(0)',
          })
        }
      }}
    >
      {children}
    </div>
  )

  if (href) {
    return (
      <a href={href} style={{ textDecoration: 'none', display: 'block' }}>
        {element}
      </a>
    )
  }

  return element
}
