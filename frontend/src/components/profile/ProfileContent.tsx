'use client'

import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useState, Suspense } from 'react'

interface User {
  id?: string
  email?: string | null
  name?: string | null
  image?: string | null
}

interface ProfileContentProps {
  locale: string
  user: User
}

export default function ProfileContent({ locale, user }: ProfileContentProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    await signOut({ redirect: false })
    router.push(`/${locale}`)
  }

  return (
    <div
      style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '60px 40px',
        color: 'var(--text-primary)',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '60px', textAlign: 'center' }}>
        <h1
          style={{
            fontSize: '48px',
            fontFamily: 'var(--font-serif)',
            fontWeight: 600,
            marginBottom: '12px',
          }}
        >
          My Profile
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          Manage your account and saved products
        </p>
      </div>

      {/* Profile Card */}
      <div
        style={{
          padding: '40px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          marginBottom: '40px',
        }}
      >
        {/* Avatar + Info */}
        <div style={{ display: 'flex', gap: '24px', marginBottom: '32px' }}>
          {/* Avatar */}
          {user.image ? (
            <img
              src={user.image}
              alt={user.name || 'User avatar'}
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '8px',
                objectFit: 'cover',
              }}
            />
          ) : (
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, var(--accent), rgba(37, 99, 235, 0.3))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
              }}
            >
              👤
            </div>
          )}

          {/* User Info */}
          <div style={{ flex: 1 }}>
            <h2
              style={{
                fontSize: '24px',
                fontWeight: 600,
                marginBottom: '8px',
              }}
            >
              {user.name || 'User'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              {user.email}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '8px' }}>
              Logged in with Google
            </p>
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            height: '1px',
            background: 'var(--border)',
            marginBottom: '32px',
          }}
        />

        {/* Account Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '24px',
            marginBottom: '32px',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: '8px',
              }}
            >
              Account Created
            </div>
            <div
              style={{
                fontSize: '16px',
                fontWeight: 600,
              }}
            >
              {new Date().toLocaleDateString()}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: '8px',
              }}
            >
              Saved Products
            </div>
            <div
              style={{
                fontSize: '16px',
                fontWeight: 600,
              }}
            >
              0
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '12px 24px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--red)',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'all var(--transition-fast)',
            opacity: isLoading ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'
          }}
        >
          {isLoading ? 'Logging out...' : 'Logout'}
        </button>
      </div>

      {/* Coming Soon Section */}
      <div
        style={{
          padding: '32px',
          background: 'rgba(37, 99, 235, 0.06)',
          border: '1px solid rgba(37, 99, 235, 0.2)',
          borderLeft: '3px solid var(--accent)',
          borderRadius: '8px',
        }}
      >
        <h3
          style={{
            fontSize: '16px',
            fontWeight: 600,
            marginBottom: '16px',
          }}
        >
          ✨ Coming Soon
        </h3>
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <li style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
            📌 Save and track your favorite products
          </li>
          <li style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
            🔔 Get notified when new reviews are available
          </li>
          <li style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
            📊 View your saved products comparison chart
          </li>
          <li style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
            ⚙️ Customize your notification preferences
          </li>
        </ul>
      </div>
    </div>
  )
}
