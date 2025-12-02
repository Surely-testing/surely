// ============================================
// FILE: app/(auth)/forgot-password/page.tsx
// ============================================
import { Metadata } from 'next'
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'

export const metadata: Metadata = {
  title: 'Forgot Password',
  description: 'Reset your Surely account password',
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />
}