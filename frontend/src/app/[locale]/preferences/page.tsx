'use client'
export const dynamic = 'force-dynamic'

import { use, useState, useEffect } from 'react'
import Link from 'next/link'

export default function PreferencesPage({
  params,
}: {
  params: Promise<{
    locale: string
  }>
}) {
  const { locale } = use(params)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [defaultLocale, setDefaultLocale] = useState(locale)
  const [defaultSort, setDefaultSort] = useState('trust_score_desc')
  const [savedSearches, setSavedSearches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    // In a real app, this would fetch from the API
    // For now, we'll show placeholder data
    setLoading(false)
  }, [])

  const handleSavePreferences = async () => {
    setSaving(true)
    setMessage('')

    try {
      // API call would go here
      // await fetch(`/api/v1/users/{userId}/preferences`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     email_notifications: emailNotifications,
      //     default_locale: defaultLocale,
      //     default_sort: defaultSort,
      //   }),
      // })

      setMessage('Preferences saved successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('Error saving preferences. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Preferences</h1>
        <p className="text-gray-600">Manage your TrustLens settings</p>
      </div>

      {/* Preferences Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8">
        <h2 className="text-2xl font-bold mb-6">General Settings</h2>

        {message && (
          <div
            className={`mb-6 px-4 py-3 rounded-lg ${
              message.includes('successfully')
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message}
          </div>
        )}

        <div className="space-y-6">
          {/* Email Notifications */}
          <div className="flex items-center justify-between pb-6 border-b border-gray-200">
            <div>
              <h3 className="font-semibold text-gray-900">Email Notifications</h3>
              <p className="text-sm text-gray-600 mt-1">
                Receive updates when verdicts are ready for saved products
              </p>
            </div>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="w-5 h-5 rounded"
              />
            </label>
          </div>

          {/* Default Locale */}
          <div className="pb-6 border-b border-gray-200">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Default Locale
            </label>
            <select
              value={defaultLocale}
              onChange={(e) => setDefaultLocale(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="in">🇮🇳 India (in)</option>
              <option value="us">🇺🇸 United States (us)</option>
              <option value="uk">🇬🇧 United Kingdom (uk)</option>
            </select>
          </div>

          {/* Default Sort */}
          <div className="pb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Default Sort Order
            </label>
            <select
              value={defaultSort}
              onChange={(e) => setDefaultSort(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="trust_score_desc">Highest Trust Score</option>
              <option value="trust_score_asc">Lowest Trust Score</option>
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
              <option value="newest">Newest First</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleSavePreferences}
          disabled={saving}
          className="mt-8 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>

      {/* Saved Searches Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-6">Saved Searches</h2>

        {savedSearches.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">You haven't saved any searches yet</p>
            <Link
              href={`/${locale}/search`}
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Start searching →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {savedSearches.map((search: any) => (
              <div
                key={search.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition"
              >
                <div>
                  <h3 className="font-semibold text-gray-900">{search.query}</h3>
                  {search.category && (
                    <p className="text-sm text-gray-600">Category: {search.category}</p>
                  )}
                </div>
                <button className="px-3 py-2 text-red-600 hover:bg-red-50 rounded transition">
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
