import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6">
      <div className="max-w-md text-center">
        <h1 className="text-4xl font-bold mb-4">404 – Not Found</h1>
        <p className="text-gray-600 mb-8">
          This product hasn't been analyzed yet. Submit it below and we'll create a verdict for you.
        </p>
        <div className="space-y-4">
          <Link href="/in/submit" className="block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
            Suggest This Product
          </Link>
          <Link href="/in" className="block px-6 py-3 bg-gray-200 text-gray-900 font-semibold rounded-lg hover:bg-gray-300">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
