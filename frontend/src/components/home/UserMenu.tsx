'use client'

import { useState } from 'react'
import { LogOut } from 'lucide-react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface UserMenuProps {
  locale: string
}

interface MobileUserMenuProps {
  locale: string
  setMobileMenuOpen: (open: boolean) => void
}

export function MobileUserMenu({ locale, setMobileMenuOpen }: MobileUserMenuProps) {
  const { data: session } = useSession()
  const router = useRouter()

  if (!session?.user) {
    return (
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
    )
  }

  return (
    <>
      <Link
        href={`/${locale}/profile`}
        style={{
          fontSize: '16px',
          color: 'var(--text-primary)',
          textDecoration: 'none',
          padding: '12px 0',
          display: 'block',
        }}
        onClick={() => setMobileMenuOpen(false)}
      >
        👤 My Profile
      </Link>
      <button
        onClick={async () => {
          setMobileMenuOpen(false)
          await signOut({ redirect: false })
          router.push(`/${locale}`)
        }}
        style={{
          fontSize: '16px',
          color: 'var(--red)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          padding: '12px 0',
        }}
      >
        Logout
      </button>
    </>
  )
}

export function UserMenuContent({ locale }: UserMenuProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { data: session } = useSession()
  const router = useRouter()

  if (!session?.user) {
    // Phase 1: No auth UI shown
    return null
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setUserMenuOpen(!userMenuOpen)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 8px',
          borderRadius: '6px',
          transition: 'background var(--transition-base)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(0,0,0,0.04)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'none'
        }}
      >
        {session.user.image ? (
          <img
            src={session.user.image}
            alt={session.user.name || 'User'}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              color: 'white',
            }}
          >
            👤
          </div>
        )}
      </button>

      {userMenuOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            background: 'var(--surface-1)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            minWidth: '200px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
          }}
        >
          <Link
            href={`/${locale}/profile`}
            style={{
              display: 'block',
              padding: '12px 16px',
              color: 'var(--text-primary)',
              textDecoration: 'none',
              fontSize: '14px',
              borderBottom: '1px solid var(--border)',
              transition: 'background var(--transition-base)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(37, 99, 235, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none'
            }}
            onClick={() => setUserMenuOpen(false)}
          >
            👤 My Profile
          </Link>
          <button
            onClick={async () => {
              setUserMenuOpen(false)
              await signOut({ redirect: false })
              router.push(`/${locale}`)
            }}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '12px 16px',
              color: 'var(--red)',
              background: 'none',
              border: 'none',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'background var(--transition-base)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none'
            }}
          >
            <LogOut
              size={14}
              style={{ display: 'inline', marginRight: '6px' }}
            />
            Logout
          </button>
        </div>
      )}
    </div>
  )
}
