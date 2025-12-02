
// ============================================
// FILE: app/(marketing)/page.tsx
// ============================================
import { Hero } from '@/components/marketing/Hero'
import { Features } from '@/components/marketing/Features'
import { Pricing } from '@/components/marketing/Pricing'
import { Testimonials } from '@/components/marketing/Testimonials'
import { CTA } from '@/components/marketing/CTA'

export default function blog() {
  return (
    <>
      <Hero />
      <Features />
      <Pricing />
      <Testimonials />
      <CTA />
    </>
  )
}