import { Suspense } from 'react'
import VerdictCard from '@/components/VerdictCard'
import { api } from '@/lib/api'
import { notFound } from 'next/navigation'

async function VerdictContent({ locale, slug }: { locale: string; slug: string }) {
  try {
    const verdict = await api.getVerdict(locale, slug)
    return <VerdictCard card={verdict} />
  } catch (error) {
    notFound()
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; category: string; product: string }>
}) {
  const { locale, product } = await params
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <Suspense fallback={<div className="text-center py-12">Loading verdict...</div>}>
        <VerdictContent locale={locale} slug={product} />
      </Suspense>
    </div>
  )
}
