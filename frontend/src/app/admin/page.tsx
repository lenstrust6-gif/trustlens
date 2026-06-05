'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

interface AdminStats {
  total_products: number
  total_verdicts: number
  pending_misses: number
  cache_hit_rate: number
  emails_captured: number
}

interface Product {
  id: string
  name: string
  slug: string
  category: string
  trust_score: number
  confidence_tier: string
  created_at: string
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'products'>('overview')

  useEffect(() => {
    const loadData = async () => {
      try {
        const statsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/stats`)
        if (statsRes.ok) {
          const data = await statsRes.json()
          setStats(data)
        }

        const productsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/products`)
        if (productsRes.ok) {
          const data = await productsRes.json()
          setProducts(data.products || [])
        }
      } catch (error) {
        console.error('Failed to load admin data', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) return <div className="p-6">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-300">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 font-semibold ${
              activeTab === 'overview' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 font-semibold ${
              activeTab === 'products' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'
            }`}
          >
            Products
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-600 text-sm font-semibold">Total Products</p>
              <p className="text-3xl font-bold mt-2">{stats.total_products}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-600 text-sm font-semibold">Verdicts Ready</p>
              <p className="text-3xl font-bold mt-2">{stats.total_verdicts}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-600 text-sm font-semibold">Pending Searches</p>
              <p className="text-3xl font-bold mt-2">{stats.pending_misses}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-600 text-sm font-semibold">Cache Hit Rate</p>
              <p className="text-3xl font-bold mt-2">{(stats.cache_hit_rate * 100).toFixed(0)}%</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-600 text-sm font-semibold">Emails Captured</p>
              <p className="text-3xl font-bold mt-2">{stats.emails_captured}</p>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="bg-white rounded-lg shadow">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-300">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Product</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Category</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Trust Score</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Tier</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{product.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{product.category}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${(product.trust_score / 10) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold">{product.trust_score.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                          {product.confidence_tier}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
