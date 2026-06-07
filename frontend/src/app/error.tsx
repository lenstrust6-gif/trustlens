'use client'
export const dynamic = 'force-dynamic'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6">
      <div className="max-w-md text-center">
        <h1 className="text-4xl font-bold mb-4">Something Went Wrong</h1>
        <p className="text-gray-600 mb-8">
          We encountered an unexpected error. Please try again or go back to search.
        </p>
        <button
          onClick={() => reset()}
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
