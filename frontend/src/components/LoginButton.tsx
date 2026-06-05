'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface LoginButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export default function LoginButton({
  variant = 'primary',
  size = 'md',
}: LoginButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogin = () => {
    setLoading(true)
    // Redirect to OAuth flow (NextAuth.js will handle this)
    // This is a placeholder - actual implementation would use signIn() from next-auth/react
    router.push('/api/auth/signin')
  }

  const baseClasses = 'font-semibold rounded-lg transition disabled:opacity-50'

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    ghost: 'bg-transparent text-blue-600 hover:bg-blue-50 border border-blue-600',
  }

  return (
    <button
      onClick={handleLogin}
      disabled={loading}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} flex items-center gap-2`}
    >
      {loading ? (
        <>
          <span className="animate-spin">⏳</span>
          Signing in...
        </>
      ) : (
        <>
          <span>🔐</span>
          Sign in with Google
        </>
      )}
    </button>
  )
}
