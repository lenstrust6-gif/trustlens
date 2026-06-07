import { notFound } from 'next/navigation'
import { LOCALE_CONFIG } from '@/lib/locale'
import NavBar from '@/components/home/NavBar'
import { AuthProvider } from '@/components/providers/AuthProvider'
import '@/styles/trustlens-theme.css'

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
    <AuthProvider>
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg)',
          color: 'var(--text-primary)',
        }}
      >
        <NavBar locale={locale} />
        <main style={{ flex: 1 }}>{children}</main>
        <footer
          style={{
            borderTop: '1px solid var(--border)',
            padding: '24px 40px',
            textAlign: 'center',
            fontSize: '12px',
            color: 'var(--text-muted)',
          }}
        >
          <p>&copy; 2026 TrustLens. Product reviews for India, by Indians.</p>
        </footer>
      </div>
    </AuthProvider>
  )
}
