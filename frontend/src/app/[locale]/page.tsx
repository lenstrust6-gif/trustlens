import { use } from 'react'
import HeroSection from '@/components/home/HeroSection'
import HowItWorks from '@/components/home/HowItWorks'
import VerdictPreview from '@/components/home/VerdictPreview'
import TestimonialsSection from '@/components/home/TestimonialsSection'
import CategoryBrowse from '@/components/home/CategoryBrowse'
import AuthenticitySection from '@/components/home/AuthenticitySection'
import CompetitorContext from '@/components/home/CompetitorContext'
import SubmitProduct from '@/components/home/SubmitProduct'
import HomeFooter from '@/components/home/HomeFooter'

export const metadata = {
  title: 'TrustLens — Real Product Reviews for India. AI-Powered. No Fakes.',
  description: 'TrustLens analyses YouTube comments and Amazon.in reviews with AI. Authenticity-scored verdicts on any product. The Fakespot replacement India was waiting for.',
}

export default function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = use(params)

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text-primary)' }}>
      {/* Hero Section */}
      <HeroSection locale={locale} />

      {/* How It Works */}
      <HowItWorks locale={locale} />

      {/* Verdict Preview */}
      <VerdictPreview locale={locale} />

      {/* Testimonials */}
      <TestimonialsSection locale={locale} />

      {/* Category Browse */}
      <CategoryBrowse locale={locale} />

      {/* Authenticity Section */}
      <AuthenticitySection locale={locale} />

      {/* Competitor Context */}
      <CompetitorContext locale={locale} />

      {/* Submit Product */}
      <SubmitProduct locale={locale} />

      {/* Footer */}
      <HomeFooter locale={locale} />
    </div>
  )
}
