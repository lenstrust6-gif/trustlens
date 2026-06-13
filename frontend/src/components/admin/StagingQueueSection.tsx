'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle, Clock, Trash2 } from 'lucide-react'

interface StagingItem {
  id: string
  name: string
  asin?: string
  category?: string
  brand?: string
  source: string
  review_count_amazon: number
  review_count_youtube: number
  status: string
  priority: string
  demand_count: number
  approved_by?: string
  detected_at: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function StagingQueueSection() {
  const [items, setItems] = useState<StagingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending')
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    fetchStagingQueue()
    fetchPendingCount()
  }, [filter])

  const fetchStagingQueue = async () => {
    try {
      const status = filter === 'pending' ? 'pending_editorial' : filter === 'approved' ? 'approved' : ''
      const query = status ? `?status=${status}` : ''
      const response = await fetch(`${API_URL}/api/v1/admin/staging-queue${query}`)
      const data = await response.json()
      setItems(data.items || [])
    } catch (error) {
      console.error('Failed to fetch staging queue:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPendingCount = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/admin/staging-queue/pending`)
      const data = await response.json()
      setPendingCount(data.pending_count || 0)
    } catch (error) {
      console.error('Failed to fetch pending count:', error)
    }
  }

  const handleApprove = async (itemId: string, itemName: string) => {
    if (!window.confirm(`Approve "${itemName}" for verdict generation?`)) return

    try {
      const response = await fetch(`${API_URL}/api/v1/admin/staging-queue/${itemId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (response.ok) {
        alert('✅ Approved!')
        fetchStagingQueue()
        fetchPendingCount()
      } else {
        alert('❌ Failed to approve')
      }
    } catch (error) {
      console.error('Error approving:', error)
      alert('Error approving item')
    }
  }

  const handleReject = async (itemId: string, itemName: string) => {
    if (!window.confirm(`Reject "${itemName}"? It will be marked as insufficient data.`)) return

    try {
      const response = await fetch(`${API_URL}/api/v1/admin/staging-queue/${itemId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (response.ok) {
        alert('✅ Rejected!')
        fetchStagingQueue()
        fetchPendingCount()
      } else {
        alert('❌ Failed to reject')
      }
    } catch (error) {
      console.error('Error rejecting:', error)
      alert('Error rejecting item')
    }
  }

  const handleDelete = async (itemId: string, itemName: string) => {
    if (!window.confirm(`Delete "${itemName}"? This cannot be undone.`)) return

    try {
      const response = await fetch(`${API_URL}/api/v1/admin/staging-queue/${itemId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        alert('✅ Deleted!')
        fetchStagingQueue()
        fetchPendingCount()
      } else {
        alert('❌ Failed to delete')
      }
    } catch (error) {
      console.error('Error deleting:', error)
      alert('Error deleting item')
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#DC2626'
      case 'normal':
        return '#2563EB'
      case 'low':
        return '#6366F1'
      default:
        return '#999999'
    }
  }

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'amazon_new_releases':
        return '🔍 New Release'
      case 'user_submit':
        return '👤 User Submit'
      case 'scheduled_launch':
        return '📅 Scheduled'
      case 'manual':
        return '✋ Manual'
      default:
        return source
    }
  }

  return (
    <div style={{ marginBottom: '40px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px' }}>
          📋 Staging Queue
        </h2>
        <p style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>
          {pendingCount} products awaiting editorial review
        </p>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {(['all', 'pending', 'approved'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              style={{
                padding: '8px 16px',
                background: filter === tab ? '#2563EB' : '#f0f0f0',
                color: filter === tab ? 'white' : '#333',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (filter !== tab) {
                  e.currentTarget.style.background = '#e0e0e0'
                }
              }}
              onMouseLeave={(e) => {
                if (filter !== tab) {
                  e.currentTarget.style.background = '#f0f0f0'
                }
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Items List */}
      {loading ? (
        <div style={{ padding: '20px', color: '#999' }}>Loading...</div>
      ) : items.length === 0 ? (
        <div style={{ padding: '20px', color: '#999' }}>No items in {filter} status</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                background: 'white',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                padding: '16px',
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: '16px',
                alignItems: 'start',
              }}
            >
              {/* Left: Product Info */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '8px',
                  }}
                >
                  {/* Status Icon */}
                  {item.status === 'pending_editorial' ? (
                    <AlertCircle size={18} color='#F59E0B' />
                  ) : item.status === 'approved' ? (
                    <CheckCircle size={18} color='#10B981' />
                  ) : (
                    <Clock size={18} color='#6366F1' />
                  )}

                  {/* Product Name */}
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#1a1a1a' }}>
                    {item.name}
                  </h3>

                  {/* Priority Badge */}
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      background: getPriorityColor(item.priority),
                      color: 'white',
                      borderRadius: '4px',
                      fontWeight: 600,
                    }}
                  >
                    {item.priority.toUpperCase()}
                  </span>

                  {/* Source Badge */}
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      background: '#f0f0f0',
                      color: '#666',
                      borderRadius: '4px',
                    }}
                  >
                    {getSourceBadge(item.source)}
                  </span>
                </div>

                {/* Meta Info */}
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                  {item.category && <span>{item.category}</span>}
                  {item.brand && <span> · {item.brand}</span>}
                  {item.asin && <span> · {item.asin}</span>}
                </div>

                {/* Review Counts */}
                <div
                  style={{
                    display: 'flex',
                    gap: '16px',
                    fontSize: '13px',
                    color: '#333',
                  }}
                >
                  <div>
                    📦 Amazon: <strong>{item.review_count_amazon}</strong> reviews
                  </div>
                  <div>
                    🎬 YouTube: <strong>{item.review_count_youtube}</strong> videos
                  </div>
                  {item.demand_count > 0 && (
                    <div>
                      👥 Demand: <strong>{item.demand_count}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {item.status === 'pending_editorial' && (
                  <>
                    <button
                      onClick={() => handleApprove(item.id, item.name)}
                      style={{
                        padding: '8px 16px',
                        background: '#10B981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 600,
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#059669')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#10B981')}
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => handleReject(item.id, item.name)}
                      style={{
                        padding: '8px 16px',
                        background: '#F59E0B',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 600,
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#D97706')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#F59E0B')}
                    >
                      ✗ Reject
                    </button>
                  </>
                )}

                <button
                  onClick={() => handleDelete(item.id, item.name)}
                  style={{
                    padding: '8px 12px',
                    background: '#f0f0f0',
                    color: '#666',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#e0e0e0')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#f0f0f0')}
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
