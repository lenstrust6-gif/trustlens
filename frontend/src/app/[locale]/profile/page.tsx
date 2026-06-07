'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [isLoading, setIsLoading] = useState(false)

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading...</p>
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>Not signed in</h1>
          <Link href={`/${params.locale}/auth/signin`} style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            Sign in to view your profile
          </Link>
        </div>
      </div>
    )
  }

  const handleSignOut = async () => {
    setIsLoading(true)
    await signOut({ redirect: false })
    router.push(`/${params.locale}`)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text-primary)', paddingTop: '120px', paddingBottom: '60px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 40px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 600, marginBottom: '40px' }}>My Profile</h1>

        <div style={{ padding: '32px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: '12px', marginBottom: '32px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            {session.user.image ? (
              <img src={session.user.image} alt={session.user.name || 'Profile'} style={{ width: '96px', height: '96px', borderRadius: '50%', objectFit: 'cover', marginBottom: '16px', border: '3px solid var(--accent)' }} />
            ) : (
              <div style={{ width: '96px', height: '96px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', margin: '0 auto 16px' }}>👤</div>
            )}
          </div>

          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>{session.user.name || 'User'}</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{session.user.email}</p>
          </div>

          <div style={{ marginBottom: '32px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <div style={{ padding: '16px', background: 'rgba(37, 99, 235, 0.08)', borderRadius: '8px', border: '1px solid rgba(37, 99, 235, 0.2)' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Account Status</p>
              <p style={{ fontSize: '14px', fontWeight: 600 }}>Active</p>
            </div>
            <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Auth Method</p>
              <p style={{ fontSize: '14px', fontWeight: 600 }}>Google OAuth</p>
            </div>
          </div>

          <button onClick={handleSignOut} disabled={isLoading} style={{ width: '100%', padding: '12px 24px', background: 'var(--red)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', opacity: isLoading ? 0.5 : 1 }}>
            {isLoading ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>

        <div style={{ padding: '16px', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
          <p style={{ fontWeight: 600, marginBottom: '8px' }}>🔒 Privacy Notice</p>
          <p>Your data is secure and encrypted. You can disconnect your Google account anytime in your Google account settings.</p>
        </div>
      </div>
    </div>
  )
}
