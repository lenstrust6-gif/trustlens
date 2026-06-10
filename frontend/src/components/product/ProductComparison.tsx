'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import ConfidenceTierBadge from './ConfidenceTierBadge'
import { calculateFeatureSimilarity, formatSpecName } from '@/lib/comparison'

interface Product {
  name: string
  slug: string
  trust_score: number
  confidence_tier: string
  feature_scores: Record<string, number>
  spec_tags: Record<string, string>
  auth_score_avg: number
}

interface ProductComparisonProps {
  product1: Product
  product2: Product
  isOpen: boolean
  onClose: () => void
}

export default function ProductComparison({
  product1,
  product2,
  isOpen,
  onClose,
}: ProductComparisonProps) {
  if (!isOpen) return null

  const similarity = calculateFeatureSimilarity(product1.feature_scores, product2.feature_scores)

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'var(--bg)',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.1)',
          maxWidth: '900px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          color: 'var(--text-primary)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '24px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            position: 'sticky',
            top: 0,
            background: 'var(--bg)',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>
            Product Comparison
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              padding: '8px',
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Similarity Score */}
        <div
          style={{
            padding: '16px 24px',
            background: 'rgba(255,255,255,0.04)',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Feature Match</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#00d9ff' }}>
              {similarity}%
            </div>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', flex: 1 }}>
            {similarity > 80
              ? 'Very similar feature profiles'
              : similarity > 60
                ? 'Moderately similar features'
                : 'Different feature sets'}
          </div>
        </div>

        {/* Comparison Table */}
        <div style={{ padding: '24px' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '13px',
            }}
          >
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th
                  style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                  }}
                >
                  Metric
                </th>
                <th
                  style={{
                    padding: '12px',
                    textAlign: 'center',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                  }}
                >
                  {product1.name}
                </th>
                <th
                  style={{
                    padding: '12px',
                    textAlign: 'center',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                  }}
                >
                  {product2.name}
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Trust Score */}
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <td style={{ padding: '12px' }}>Trust Score</td>
                <td style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>
                  {product1.trust_score.toFixed(1)}/10
                </td>
                <td style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>
                  {product2.trust_score.toFixed(1)}/10
                </td>
              </tr>

              {/* Confidence Tier */}
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <td style={{ padding: '12px' }}>Confidence Tier</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <ConfidenceTierBadge tier={product1.confidence_tier} />
                  </div>
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <ConfidenceTierBadge tier={product2.confidence_tier} />
                  </div>
                </td>
              </tr>

              {/* Auth Score */}
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <td style={{ padding: '12px' }}>Auth Score Avg</td>
                <td style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>
                  {product1.auth_score_avg.toFixed(0)}/100
                </td>
                <td style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>
                  {product2.auth_score_avg.toFixed(0)}/100
                </td>
              </tr>

              {/* Feature Scores */}
              {Object.entries(product1.feature_scores).map(([feature, score1]) => {
                const score2 = product2.feature_scores[feature]
                if (score2 === undefined) return null

                const diff = Math.abs(score1 - score2)
                const winner = score1 > score2 ? 1 : score2 > score1 ? 2 : 0

                return (
                  <tr key={feature} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <td style={{ padding: '12px' }}>{formatSpecName(feature)}</td>
                    <td
                      style={{
                        padding: '12px',
                        textAlign: 'center',
                        fontWeight: winner === 1 ? 700 : 500,
                        color: winner === 1 ? '#00d9ff' : 'var(--text-primary)',
                      }}
                    >
                      {score1.toFixed(1)}
                    </td>
                    <td
                      style={{
                        padding: '12px',
                        textAlign: 'center',
                        fontWeight: winner === 2 ? 700 : 500,
                        color: winner === 2 ? '#00d9ff' : 'var(--text-primary)',
                      }}
                    >
                      {score2.toFixed(1)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
