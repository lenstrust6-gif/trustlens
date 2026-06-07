'use client'

import { useState, useEffect, Suspense } from 'react'
import { Menu, X } from 'lucide-react'
import Link from 'next/link'
import { UserMenuContent, MobileUserMenu } from './UserMenu'

interface NavBarProps {
  locale: string
}

export default function NavBar({ locale }: NavBarProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 60)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSmoothScroll = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setMobileMenuOpen(false)
    }
  }

  return (
    <>
      {/* Navbar */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 'var(--z-sticky)',
          height: '64px',
          padding: '0 40px',
          background: isScrolled
            ? 'rgba(7, 9, 12, 0.92)'
            : 'transparent',
          backdropFilter: isScrolled ? 'blur(12px)' : 'none',
          transition: 'all var(--transition-slow)',
          borderBottom: isScrolled ? `1px solid var(--border)` : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Left: Logo */}
        <Link
          href={`/${locale}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              background: 'var(--accent)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold',
            }}
          >
            ✓
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <span
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                lineHeight: 1,
              }}
            >
              TrustLens
            </span>
            <span
              style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                marginTop: '2px',
              }}
            >
              Real reviews. Trusted verdicts.
            </span>
          </div>
        </Link>

        {/* Center: Nav Links (Desktop Only) */}
        <div
          style={{
            display: 'none',
            gap: '40px',
          }}
          className="hidden lg:flex"
        >
          <button
            onClick={() => handleSmoothScroll('how-it-works')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '14px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'color var(--transition-base)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)'
            }}
          >
            How it works
          </button>
          <button
            onClick={() => handleSmoothScroll('categories')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '14px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'color var(--transition-base)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)'
            }}
          >
            Categories
          </button>
          <Link
            href={`/${locale}/methodology`}
            style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              transition: 'color var(--transition-base)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)'
            }}
          >
            Methodology
          </Link>
        </div>

        {/* Right: Desktop */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
          }}
          className="hidden lg:flex"
        >
          <Link
            href={`/${locale}/submit`}
            style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              transition: 'color var(--transition-base)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)'
            }}
          >
            Submit a product
          </Link>
          <div
            style={{
              width: '1px',
              height: '20px',
              background: 'var(--border)',
            }}
          />

          {/* User Menu */}
          <Suspense
            fallback={
              <div
                style={{
                  padding: '4px 12px',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                }}
              >
                🇮🇳 India
              </div>
            }
          >
            <UserMenuContent locale={locale} />
          </Suspense>
        </div>

        {/* Right: Mobile Menu Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          className="lg:hidden"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <X size={24} color="var(--text-primary)" />
          ) : (
            <Menu size={24} color="var(--text-primary)" />
          )}
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--bg)',
            zIndex: 99,
            padding: '60px 20px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          <button
            onClick={() => handleSmoothScroll('how-it-works')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '16px',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              textAlign: 'left',
              padding: '12px 0',
            }}
          >
            How it works
          </button>
          <button
            onClick={() => handleSmoothScroll('categories')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '16px',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              textAlign: 'left',
              padding: '12px 0',
            }}
          >
            Categories
          </button>
          <Link
            href={`/${locale}/methodology`}
            style={{
              fontSize: '16px',
              color: 'var(--text-primary)',
              textDecoration: 'none',
              padding: '12px 0',
            }}
          >
            Methodology
          </Link>
          <Link
            href={`/${locale}/submit`}
            style={{
              fontSize: '16px',
              color: 'var(--text-primary)',
              textDecoration: 'none',
              padding: '12px 0',
            }}
          >
            Submit a product
          </Link>

          <div
            style={{
              height: '1px',
              background: 'var(--border)',
              margin: '12px 0',
            }}
          />
          <Suspense
            fallback={
              <Link
                href={`/${locale}/auth/signin`}
                style={{
                  fontSize: '16px',
                  color: 'var(--accent)',
                  textDecoration: 'none',
                  padding: '12px 0',
                  display: 'block',
                }}
              >
                Sign in
              </Link>
            }
          >
            <MobileUserMenu locale={locale} setMobileMenuOpen={setMobileMenuOpen} />
          </Suspense>
        </div>
      )}
    </>
  )
}
