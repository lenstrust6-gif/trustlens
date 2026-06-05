'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'

interface LoginButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  callbackUrl?: string
}

export default function LoginButton({
  variant = 'primary',
  size = 'md',
  callbackUrl = '/',
}: LoginButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    try {
      await signIn('google', { callbackUrl })
    } catch (error) {
      console.error('Sign in error:', error)
      setLoading(false)
    }
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
