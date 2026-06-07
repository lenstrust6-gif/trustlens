interface SectionLabelProps {
  text: string
  className?: string
}

export default function SectionLabel({
  text,
  className = '',
}: SectionLabelProps) {
  return (
    <div
      className={className}
      style={{
        fontSize: '11px',
        letterSpacing: '0.15em',
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        fontWeight: 500,
        marginBottom: '16px',
      }}
    >
      {text}
    </div>
  )
}
