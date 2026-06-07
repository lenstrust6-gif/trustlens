'use client'

interface CheckboxOption {
  label: string
  value: string
  count?: number
}

interface CheckboxGroupProps {
  options: CheckboxOption[]
  selectedValues: string[]
  onChange: (values: string[]) => void
  label?: string
}

export default function CheckboxGroup({
  options,
  selectedValues,
  onChange,
  label,
}: CheckboxGroupProps) {
  const handleChange = (value: string) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value]
    onChange(newValues)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {label && (
        <label style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          {label}
        </label>
      )}
      {options.map(option => (
        <label
          key={option.value}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          <input
            type="checkbox"
            checked={selectedValues.includes(option.value)}
            onChange={() => handleChange(option.value)}
            style={{
              cursor: 'pointer',
              width: '16px',
              height: '16px',
            }}
          />
          <span>{option.label}</span>
          {option.count !== undefined && (
            <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-muted)' }}>
              ({option.count})
            </span>
          )}
        </label>
      ))}
    </div>
  )
}
