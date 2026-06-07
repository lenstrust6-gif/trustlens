'use client'
export const dynamic = 'force-dynamic'

import { signIn } from 'next-auth/react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState, Suspense } from 'react'

function SignInContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await signIn('google', {
        callbackUrl,
        redirect: true,
      })

      if (result?.error) {
        setError(result.error)
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
      console.error('Sign in error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to TrustLens</h1>
          <p className="text-gray-600">Sign in to save searches and manage preferences</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error === 'OAuthSignin' && 'Failed to sign in with Google'}
            {error === 'OAuthCallback' && 'Failed to handle Google callback'}
            {error === 'OAuthCreateAccount' && 'Could not create account'}
            {error === 'EmailCreateAccount' && 'Could not create email'}
            {!['OAuthSignin', 'OAuthCallback', 'OAuthCreateAccount', 'EmailCreateAccount'].includes(error) &&
              error}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition disabled:opacity-50 flex items-center justify-center gap-3"
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

          <p className="text-center text-sm text-gray-600">
            We use Google OAuth for secure authentication
          </p>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <button
              onClick={() => handleGoogleSignIn()}
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Sign up with Google
            </button>
          </p>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg text-xs text-blue-800">
          <p className="font-semibold mb-2">🔒 Your privacy matters</p>
          <p>
            We only request your email and name. Never password. You can disconnect anytime in your
            Google account settings.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInContent />
    </Suspense>
  )
}
