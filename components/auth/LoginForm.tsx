// ============================================
// FILE: components/auth/LoginForm.tsx (FIXED REDIRECT)
// ============================================
'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useSupabase } from '@/providers/SupabaseProvider'

const LoginForm = () => {
  const router = useRouter()
  const { supabase } = useSupabase()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (signInError) throw signInError

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('registration_completed')
          .eq('id', data.user.id)
          .single()

        // Get the redirect URL from query params
        const searchParams = new URLSearchParams(window.location.search)
        const redirectUrl = searchParams.get('redirect')

        if (profile && !profile.registration_completed) {
          toast.success('Welcome! Let\'s complete your setup', {
            description: 'Just a few steps to get started...',
          })
          router.push('/onboarding')
        } else {
          toast.success('Welcome back!', {
            description: 'Redirecting...',
          })
          // Use redirect URL if it exists, otherwise default to dashboard
          router.push(redirectUrl || '/dashboard')
        }

        router.refresh()
      }
    } catch (err: any) {
      toast.error('Sign in failed', {
        description: err.message || 'Invalid email or password',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (err: any) {
      toast.error('Google sign in failed', {
        description: err.message,
      })
    }
  }

  return (
    <div className="w-full space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
          Welcome back
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground">
          Sign in to continue to Surely
        </p>
      </div>

      {/* Social Login */}
      <div className="space-y-3">
        <Button
          type="button"
          variant="outline"
          className="w-full h-12 text-base font-medium"
          onClick={handleGoogleSignIn}
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </Button>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-background text-muted-foreground">
            Or continue with email
          </span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email address"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="you@example.com"
          leftIcon={<Mail className="h-5 w-5" />}
          className="h-12 text-base"
          required
          autoComplete="email"
        />

        <div>
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            leftIcon={<Lock className="h-5 w-5" />}
            className="h-12 text-base"
            required
            autoComplete="current-password"
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 -mr-1"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            }
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center cursor-pointer group">
            <input
              type="checkbox"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
              className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer"
            />
            <span className="ml-2 text-muted-foreground group-hover:text-foreground transition-colors select-none">
              Remember me
            </span>
          </label>
          <Link
            href="/forgot-password"
            className="text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        {/* Animated Button */}
        <div className="mt-8">
          <div className="relative flex justify-center">
            <button
              type="submit"
              disabled={isLoading}
              className={`
                transition-all duration-300 ease-in-out
                ${isLoading
                  ? 'w-12 h-12 rounded-full bg-primary shadow-md flex items-center justify-center'
                  : 'w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg px-6 py-3 shadow-glow-sm hover:shadow-glow-md hover:-translate-y-0.5'
                }
                disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
              `}
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                'Sign In'
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Sign Up Link */}
      <div className="pt-6 border-t border-border">
        <p className="text-center text-sm sm:text-base text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="text-primary hover:text-primary/80 font-semibold transition-colors"
          >
            Create one now
          </Link>
        </p>
      </div>

      {/* Mobile App Promotion */}
      <div className="lg:hidden mt-8 p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl border border-primary/20">
        <p className="text-sm text-center text-muted-foreground">
          💡 <strong className="text-foreground">Pro tip:</strong> Add Surely to your home screen for quick access
        </p>
      </div>
    </div>
  )
}

export { LoginForm }