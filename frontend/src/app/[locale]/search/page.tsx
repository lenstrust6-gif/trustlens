import { Suspense } from 'react'
import SearchContent from './search-content'

export default async function SearchPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>}>
      <SearchContent locale={locale} />
    </Suspense>
  )
}
