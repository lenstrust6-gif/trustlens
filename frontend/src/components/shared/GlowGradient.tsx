interface GlowGradientProps {
  position?: { x: string; y: string }
  size?: { width: string; height: string }
  color?: string
  opacity?: number
  className?: string
}

export default function GlowGradient({
  position = { x: '50%', y: '60%' },
  size = { width: '900px', height: '500px' },
  color = 'var(--accent)',
  opacity = 0.1,
  className = '',
}: GlowGradientProps) {
  const width = parseInt(size.width)
  const height = parseInt(size.height)
  const rx = width / 2
  const ry = height / 2

  return (
    <svg
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
      viewBox="0 0 1000 1000"
      preserveAspectRatio="none"
    >
      <defs>
        <radialGradient id="glow" cx={position.x} cy={position.y}>
          <stop offset="0%" stopColor={color} stopOpacity={opacity} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse
        cx={position.x}
        cy={position.y}
        rx={rx}
        ry={ry}
        fill="url(#glow)"
      />
    </svg>
  )
}
