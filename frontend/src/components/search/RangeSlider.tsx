'use client'

import { useState, useCallback } from 'react'

interface RangeSliderProps {
  min: number
  max: number
  step: number
  value: number[]
  onChange: (min: number, max?: number) => void
  labels?: [string, string]
}

export default function RangeSlider({
  min,
  max,
  step,
  value,
  onChange,
  labels = [`${min}`, `${max}`],
}: RangeSliderProps) {
  const isSingleThumb = value.length === 1

  return (
    <div style={{ width: '100%' }}>
      {/* Slider Track */}
      <div
        style={{
          position: 'relative',
          height: '6px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '3px',
          marginBottom: '16px',
          marginTop: '8px',
        }}
      >
        {/* Filled Range */}
        <div
          style={{
            position: 'absolute',
            height: '100%',
            background: 'var(--accent)',
            borderRadius: '3px',
            left: `${((value[0] - min) / (max - min)) * 100}%`,
            right: isSingleThumb
              ? `${((max - value[0]) / (max - min)) * 100}%`
              : `${((max - (value[1] ?? max)) / (max - min)) * 100}%`,
          }}
        />

        {/* Min Thumb */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[0]}
          onChange={(e) => onChange(parseFloat(e.target.value), value[1])}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            top: 0,
            left: 0,
            margin: 0,
            padding: 0,
            background: 'none',
            cursor: 'pointer',
            pointerEvents: 'all',
            appearance: 'none',
            WebkitAppearance: 'none',
          } as React.CSSProperties & { WebkitAppearance: string }}
        />

        {/* Max Thumb (if range slider) */}
        {!isSingleThumb && (
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value[1] ?? max}
            onChange={(e) => onChange(value[0], parseFloat(e.target.value))}
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              top: 0,
              left: 0,
              margin: 0,
              padding: 0,
              background: 'none',
              cursor: 'pointer',
              pointerEvents: 'all',
              appearance: 'none',
              WebkitAppearance: 'none',
            } as React.CSSProperties & { WebkitAppearance: string }}
          />
        )}
      </div>

      {/* Labels */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: 'var(--text-muted)',
        }}
      >
        <span>{labels[0]}</span>
        <span>{labels[1]}</span>
      </div>

      {/* Value Display */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          marginTop: '12px',
          fontSize: '12px',
          color: 'var(--text-primary)',
        }}
      >
        <span>
          {value[0].toFixed(step < 1 ? 1 : 0)}
          {isSingleThumb ? `/${max}` : ''}
        </span>
        {!isSingleThumb && (
          <>
            <span>-</span>
            <span>{(value[1] ?? max).toFixed(step < 1 ? 1 : 0)}</span>
          </>
        )}
      </div>

      {/* CSS for slider thumb styling */}
      <style>{`
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
        }

        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--accent);
          cursor: pointer;
          border: 2px solid var(--bg);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }

        input[type="range"]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--accent);
          cursor: pointer;
          border: 2px solid var(--bg);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }

        input[type="range"]:focus {
          outline: none;
        }
      `}</style>
    </div>
  )
}
