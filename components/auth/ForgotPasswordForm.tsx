// ============================================
// FILE: components/auth/ForgotPasswordForm.tsx
// ============================================
'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft, CheckCircle2, KeyRound, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useSupabase } from '@/providers/SupabaseProvider'

const ForgotPasswordForm = () => {
  const { supabase } = useSupabase()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [email, setEmail] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (resetError) throw resetError

      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-md">
        {/* Success Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-2xl flex items-center justify-center animate-pulse">
              <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            <div className="absolute -inset-2 bg-gradient-to-br from-green-500/10 to-emerald-600/10 rounded-3xl -z-10"></div>
          </div>
        </div>

        {/* Success Message */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            Check your email
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed mb-2">
            We&apos;ve sent password reset instructions to
          </p>
          <p className="text-base font-semibold text-foreground">
            {email}
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-gradient-to-br from-muted/80 to-muted/40 border border-border rounded-xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground mb-2">
                What&apos;s next?
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Click the link in the email to reset your password. The link will expire in 1 hour.
              </p>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <Link href="/login" className="block">
          <Button 
            variant="outline" 
            className="w-full h-12 text-base font-medium group"
          >
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Sign In
          </Button>
        </Link>

        {/* Help Text */}
        <div className="mt-8 pt-6 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            Didn&apos;t receive the email?{' '}
            <button 
              onClick={() => setSuccess(false)}
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Try again
            </button>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      {/* Icon */}
      <div className="flex justify-center mb-8">
        <div className="relative">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-2xl flex items-center justify-center">
            <KeyRound className="h-10 w-10 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="absolute -inset-2 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-3xl -z-10"></div>
        </div>
      </div>

      {/* Heading */}
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
          Forgot password?
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed">
          No worries! Enter your email and we&apos;ll send you reset instructions.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="bg-gradient-to-br from-red-50 to-red-50/50 dark:from-red-900/20 dark:to-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-900 dark:text-red-200 mb-1">
                  Reset Failed
                </p>
                <p className="text-sm text-red-700 dark:text-red-300">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Email Input */}
        <div className="space-y-2">
          <Input
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            leftIcon={<Mail className="h-4 w-4" />}
            required
            className="h-12"
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          isLoading={isLoading}
        >
          {isLoading ? 'Sending...' : 'Send Reset Link'}
        </Button>

        {/* Back Button */}
        <Link href="/login" className="block">
          <Button
            variant="outline"
            className="w-full h-12 text-base font-medium group"
          >
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Sign In
          </Button>
        </Link>
      </form>

      {/* Help Section */}
      <div className="mt-8 pt-6 border-t border-border text-center">
        <p className="text-sm text-muted-foreground">
          Remember your password?{' '}
          <Link 
            href="/login" 
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export { ForgotPasswordForm }