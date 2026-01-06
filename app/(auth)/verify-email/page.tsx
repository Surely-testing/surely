// ============================================
// FILE: app/(auth)/verify-email/page.tsx
// ============================================
import { Metadata } from 'next'
import Link from 'next/link'
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export const metadata: Metadata = {
  title: 'Verify Email',
  description: 'Verify your email address',
}

export default function VerifyEmailPage() {
  return (
    <div className="w-full max-w-md">
      {/* Icon Container */}
      <div className="flex justify-center mb-8">
        <div className="relative">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-2xl flex items-center justify-center animate-pulse">
            <Mail className="h-12 w-12 text-blue-600 dark:text-blue-400" />
          </div>
          {/* Decorative ring */}
          <div className="absolute -inset-2 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-3xl -z-10"></div>
        </div>
      </div>

      {/* Heading */}
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
          Check your email
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed">
          We&apos;ve sent a verification link to your email address. 
          Click the link to verify your account and get started.
        </p>
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-br from-muted/80 to-muted/40 border border-border rounded-xl p-6 mb-8">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground mb-2">
              Didn&apos;t receive the email?
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Check your spam folder or click below to request a new verification email.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button 
          variant="primary" 
          className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
        >
          Resend Verification Email
        </Button>
        
        <Link href="/login" className="block">
          <Button 
            variant="outline" 
            className="w-full h-12 text-base font-medium group"
          >
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Sign In
          </Button>
        </Link>
      </div>

      {/* Help Text */}
      <div className="mt-8 pt-6 border-t border-border text-center">
        <p className="text-sm text-muted-foreground">
          Need help?{' '}
          <Link 
            href="/help" 
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            Contact Support
          </Link>
        </p>
      </div>
    </div>
  )
}