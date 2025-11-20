
// ============================================
// FILE: app/(auth)/login/page.tsx
// ============================================
import { Metadata } from 'next'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your Surely account',
}

export default function LoginPage() {
  return <LoginForm />
}