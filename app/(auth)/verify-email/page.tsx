// ============================================
// FILE: app/(auth)/verify-email/page.tsx
// ============================================
import { Metadata } from 'next'
import Link from 'next/link'
import { Mail, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export const metadata: Metadata = {
  title: 'Verify Email',
  description: 'Verify your email address',
}

export default function VerifyEmailPage() {
  return (
    <div className="w-full max-w-md text-center">
      <div className="mb-8">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
          <Mail className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Check your email
        </h1>
        <p className="text-muted-foreground text-lg">
          We&apos;ve sent a verification link to your email address. 
          Please click the link to verify your account and get started.
        </p>
      </div>

      <div className="bg-muted rounded-xl p-6 mb-8">
        <p className="text-sm text-muted-foreground mb-2">
          <strong>Didn&apos;t receive the email?</strong>
        </p>
        <p className="text-sm text-muted-foreground">
          Check your spam folder or request a new verification email.
        </p>
      </div>

      <div className="space-y-3">
        <Button variant="primary" className="w-full">
          Resend Verification Email
        </Button>
        <Link href="/login">
          <Button 
            variant="ghost" 
            className="w-full" 
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back to Sign In
          </Button>
        </Link>
      </div>
    </div>
  )
}