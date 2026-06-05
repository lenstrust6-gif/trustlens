import { notFound } from 'next/navigation'
import { LOCALE_CONFIG } from '@/lib/locale'

export function generateStaticParams() {
  return Object.keys(LOCALE_CONFIG).map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const localeConfig = LOCALE_CONFIG[locale as keyof typeof LOCALE_CONFIG]

  if (!localeConfig) {
    notFound()
  }

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b border-gray-200 py-4 px-6 sticky top-0 bg-white z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="text-2xl font-bold">TrustLens</div>
          <div className="flex items-center gap-6">
            <span className="text-sm text-gray-600">{localeConfig.flag} {localeConfig.name}</span>
          </div>
        </div>
      </nav>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-gray-200 py-6 px-6 text-center text-sm text-gray-500">
        <p>&copy; 2026 TrustLens. Product reviews for India, by Indians.</p>
      </footer>
    </div>
  )
}
