'use client'

import { useState, useRef } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SearchBarProps {
  placeholder?: string
  onSearch?: (query: string) => Promise<void>
  isLoading?: boolean
  className?: string
  locale?: string
}

export default function SearchBar({
  placeholder = 'Search any product...',
  onSearch,
  isLoading = false,
  className = '',
  locale = 'in',
}: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault()

    if (!query.trim()) return

    setLoading(true)

    try {
      if (onSearch) {
        await onSearch(query)
        setLoading(false)
      } else {
        // Default behavior: navigate to search page
        // Don't reset loading - page will unmount during navigation
        router.push(`/${locale}/search?q=${encodeURIComponent(query)}`)
      }
    } catch (error) {
      console.error('Search error:', error)
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <form
      onSubmit={handleSearch}
      className={`
        search-bar
        ${className}
      `}
      style={{
        display: 'flex',
        alignItems: 'center',
        height: '60px',
        background: 'rgba(0, 0, 0, 0.04)',
        border: `1px solid var(--border${isFocused ? '-hover' : ''})`,
        borderRadius: '8px',
        paddingLeft: '16px',
        paddingRight: '8px',
        transition: 'all var(--transition-fast)',
        ...(isFocused && {
          borderColor: 'rgba(37, 99, 235, 0.5)',
          boxShadow: '0 0 0 3px var(--accent-glow)',
        }),
      }}
    >
      {/* Search Icon */}
      <Search
        size={18}
        style={{
          color: 'var(--text-muted)',
          flexShrink: 0,
          marginRight: '12px',
        }}
        aria-hidden="true"
      />

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        data-testid="search-input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        aria-label="Search for a product"
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          fontSize: '15px',
          color: 'var(--text-primary)',
        }}
      />

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || isLoading}
        aria-label="Analyse product reviews"
        style={{
          height: '44px',
          marginLeft: '8px',
          padding: '0 20px',
          background: loading || isLoading ? 'var(--accent-bright)' : 'var(--accent)',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: loading || isLoading ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          fontWeight: 500,
          fontFamily: 'var(--font-body)',
          transition: 'background var(--transition-fast)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          opacity: loading || isLoading ? 0.8 : 1,
        }}
      >
        {loading || isLoading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span style={{ fontSize: '13px' }}>Searching...</span>
          </>
        ) : (
          <>
            <span>Analyse</span>
            <span>→</span>
          </>
        )}
      </button>
    </form>
  )
}
