// ============================================
// FILE: app/(auth)/verify-email/page.tsx (FIXED - Client Component)
// ============================================
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useSupabase } from '@/providers/SupabaseProvider'
import { toast } from 'sonner'
import { useSearchParams } from 'next/navigation'

export default function VerifyEmailPage() {
  const { supabase } = useSupabase()
  const searchParams = useSearchParams()
  const [isResending, setIsResending] = useState(false)
  const [resendCount, setResendCount] = useState(0)
  const [cooldown, setCooldown] = useState(0)

  // Get email from URL params or session
  const emailParam = searchParams.get('email')
  const [userEmail, setUserEmail] = useState<string | null>(emailParam)

  // Get user email from session if not in params
  useState(() => {
    if (!userEmail) {
      supabase.auth.getUser().then(({ data }) => {
        if (data.user?.email) {
          setUserEmail(data.user.email)
        }
      })
    }
  })

  const handleResendVerification = async () => {
    if (!userEmail) {
      toast.error('No email address found. Please register again.')
      return
    }

    if (cooldown > 0) {
      toast.error(`Please wait ${cooldown} seconds before resending.`)
      return
    }

    setIsResending(true)

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      setResendCount(resendCount + 1)
      
      // Set cooldown (30 seconds for first resend, 60 for subsequent)
      const cooldownTime = resendCount === 0 ? 30 : 60
      setCooldown(cooldownTime)
      
      // Countdown timer
      const interval = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      toast.success('Verification email sent! Check your inbox.')
    } catch (err: any) {
      console.error('Resend error:', err)
      
      // Handle specific error cases
      if (err.message?.includes('rate limit')) {
        toast.error('Too many requests. Please wait a few minutes.')
        setCooldown(120) // 2 minute cooldown for rate limit
      } else if (err.message?.includes('Email not found')) {
        toast.error('Email address not found. Please register again.')
      } else {
        toast.error(err.message || 'Failed to resend email. Please try again.')
      }
    } finally {
      setIsResending(false)
    }
  }

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
          We&apos;ve sent a verification link to{' '}
          {userEmail && (
            <span className="font-semibold text-foreground">{userEmail}</span>
          )}
          {!userEmail && 'your email address'}. 
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
          onClick={handleResendVerification}
          disabled={isResending || cooldown > 0}
        >
          {isResending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : cooldown > 0 ? (
            `Resend in ${cooldown}s`
          ) : resendCount > 0 ? (
            `Resend Again (${resendCount})`
          ) : (
            'Resend Verification Email'
          )}
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

      {/* Success Message */}
      {resendCount > 0 && (
        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-800 dark:text-green-200 text-center">
            ✓ Verification email sent successfully! Check your inbox.
          </p>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-8 pt-6 border-t border-border text-center">
        <p className="text-sm text-muted-foreground">
          Need help?{' '}
          <Link 
            href="/contact" 
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            Contact Support
          </Link>
        </p>
      </div>
    </div>
  )
}