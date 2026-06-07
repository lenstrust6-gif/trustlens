import React from 'react'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'red' | 'green' | 'amber' | 'blue'
  className?: string
}

export default function Badge({
  children,
  variant = 'default',
  className = '',
}: BadgeProps) {
  const variantStyles = {
    default: {
      background: 'rgba(255, 255, 255, 0.04)',
      borderColor: 'var(--border)',
      color: 'var(--text-secondary)',
    },
    red: {
      background: 'rgba(239, 68, 68, 0.12)',
      borderColor: 'rgba(239, 68, 68, 0.3)',
      color: 'var(--red)',
    },
    green: {
      background: 'rgba(16, 185, 129, 0.12)',
      borderColor: 'rgba(16, 185, 129, 0.3)',
      color: 'var(--green)',
    },
    amber: {
      background: 'rgba(245, 158, 11, 0.12)',
      borderColor: 'rgba(245, 158, 11, 0.3)',
      color: 'var(--amber)',
    },
    blue: {
      background: 'rgba(37, 99, 235, 0.12)',
      borderColor: 'rgba(37, 99, 235, 0.3)',
      color: 'var(--accent)',
    },
  }

  const style = {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 500,
    border: '1px solid',
    ...variantStyles[variant],
  }

  return (
    <span className={className} style={style}>
      {children}
    </span>
  )
}
