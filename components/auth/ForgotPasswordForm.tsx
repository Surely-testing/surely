
// ============================================
// FILE: components/auth/ForgotPasswordForm.tsx
// ============================================
'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft } from 'lucide-react'
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
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-success" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Check your email
          </h1>
          <p className="text-muted-foreground">
            We&apos;ve sent password reset instructions to <strong>{email}</strong>
          </p>
        </div>

        <Link href="/login">
          <Button variant="outline" className="w-full" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Back to Sign In
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Forgot password?
        </h1>
        <p className="text-muted-foreground">
          Enter your email and we&apos;ll send you reset instructions
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-error rounded-lg">
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          leftIcon={<Mail className="h-4 w-4" />}
          required
        />

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          isLoading={isLoading}
        >
          Send Reset Link
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
      </form>
    </div>
  )
}

export { ForgotPasswordForm }

