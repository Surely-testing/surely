// ============================================
// FILE: app/(auth)/register/page.tsx
// ============================================
import { Metadata } from 'next'
import { RegisterForm } from '@/components/auth/RegisterForm'

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Create your Surely account and start your free trial',
}

export default function RegisterPage() {
  return <RegisterForm />
}