// ============================================
// FILE: components/auth/RegisterForm.tsx (MULTI-STEP WITH SUPABASE)
// ============================================
'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Mail, Lock, User, Eye, EyeOff, Loader2, CheckCircle2,
  Building2, ArrowLeft, ChevronDown
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons'
import { useSupabase } from '@/providers/SupabaseProvider'
import { isCommonEmailProvider, isCustomDomain } from '@/utils/domainValidator'

const RegisterForm = () => {
  const router = useRouter()
  const { supabase } = useSupabase()

  const [currentStep, setCurrentStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [stepLoading, setStepLoading] = useState(false)

  const [formData, setFormData] = useState({
    accountType: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    organizationName: '',
    organizationIndustry: '',
    organizationSize: 'small',
    terms: false,
  })

  const [passwordStrength, setPasswordStrength] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isIndustryDropdownOpen, setIsIndustryDropdownOpen] = useState(false)
  const [isSizeDropdownOpen, setIsSizeDropdownOpen] = useState(false)

  const accountTypes = [
    {
      value: 'individual',
      label: 'Individual Account',
      description: 'For personal projects and individual testing',
      icon: User
    },
    {
      value: 'organization',
      label: 'Organization Account',
      description: 'For teams, companies, and collaborative testing',
      icon: Building2
    }
  ]

  const industries = [
    { value: 'technology', label: 'Technology' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'finance', label: 'Finance' },
    { value: 'education', label: 'Education' },
    { value: 'retail', label: 'Retail' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'consulting', label: 'Consulting' },
    { value: 'media', label: 'Media & Entertainment' },
    { value: 'nonprofit', label: 'Non-profit' },
    { value: 'government', label: 'Government' },
    { value: 'other', label: 'Other' }
  ]

  const organizationSizes = [
    { value: 'small', label: '1-10 employees' },
    { value: 'medium', label: '11-50 employees' },
    { value: 'large', label: '51-200 employees' },
    { value: 'enterprise', label: '200+ employees' }
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined

    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    })
    setErrors({ ...errors, [name]: '' })

    // Validate email domain for organization accounts
    if (name === 'email' && value && formData.accountType === 'organization') {
      if (isCommonEmailProvider(value)) {
        setErrors({ ...errors, email: 'Organization accounts require a custom domain email (e.g., name@yourcompany.com)' })
      } else {
        setErrors({ ...errors, email: '' })
      }
    }

    // Calculate password strength
    if (name === 'password') {
      let strength = 0
      if (value.length >= 8) strength += 25
      if (value.match(/[a-z]/)) strength += 25
      if (value.match(/[A-Z]/)) strength += 25
      if (value.match(/[0-9]/)) strength += 25
      setPasswordStrength(strength)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrors({ ...errors, [field]: '' })

    // Validate email domain for organization accounts
    if (field === 'email' && value && formData.accountType === 'organization') {
      if (isCommonEmailProvider(value)) {
        setErrors(prev => ({ ...prev, email: 'Organization accounts require a custom domain email (e.g., name@yourcompany.com)' }))
      } else {
        setErrors(prev => ({ ...prev, email: '' }))
      }
    }

    // Re-validate email when account type changes
    if (field === 'accountType' && value === 'organization' && formData.email) {
      if (isCommonEmailProvider(formData.email)) {
        setErrors(prev => ({ ...prev, email: 'Organization accounts require a custom domain email (e.g., name@yourcompany.com)' }))
      }
    }

    // Clear email error when switching to individual
    if (field === 'accountType' && value === 'individual') {
      setErrors(prev => ({ ...prev, email: '' }))
    }

    if (field === 'password') {
      let strength = 0
      if (value.length >= 8) strength += 25
      if (value.match(/[a-z]/)) strength += 25
      if (value.match(/[A-Z]/)) strength += 25
      if (value.match(/[0-9]/)) strength += 25
      setPasswordStrength(strength)
    }
  }

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {}

    switch (step) {
      case 1:
        if (!formData.accountType) {
          newErrors.accountType = 'Please select an account type'
        }
        break

      case 2:
        if (!formData.email) {
          newErrors.email = 'Email is required'
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          newErrors.email = 'Please enter a valid email address'
        } else if (formData.accountType === 'organization' && isCommonEmailProvider(formData.email)) {
          newErrors.email = 'Organization accounts require a custom domain email (e.g., name@yourcompany.com)'
        }

        if (!formData.name) {
          newErrors.name = 'Full name is required'
        } else if (formData.name.trim().length < 2) {
          newErrors.name = 'Full name must be at least 2 characters'
        }
        break

      case 3:
        if (formData.accountType === 'organization') {
          if (!formData.organizationName) {
            newErrors.organizationName = 'Organization name is required'
          } else if (formData.organizationName.trim().length < 2) {
            newErrors.organizationName = 'Organization name must be at least 2 characters'
          }

          if (!formData.organizationIndustry) {
            newErrors.organizationIndustry = 'Industry is required'
          }
        }
        break

      case 4:
        if (!formData.password) {
          newErrors.password = 'Password is required'
        } else if (formData.password.length < 8) {
          newErrors.password = 'Password must be at least 8 characters'
        }

        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match'
        }

        if (!formData.terms) {
          newErrors.terms = 'You must accept the terms and conditions'
        }
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (!validateStep(currentStep)) return

    setStepLoading(true)
    setTimeout(() => {
      if (currentStep === 2 && formData.accountType === 'individual') {
        setCurrentStep(4)
      } else {
        setCurrentStep(currentStep + 1)
      }
      setStepLoading(false)
    }, 300)
  }

  const prevStep = () => {
    if (currentStep === 4 && formData.accountType === 'individual') {
      setCurrentStep(2)
    } else {
      setCurrentStep(currentStep - 1)
    }
  }

  // Replace your handleSubmit function with this:

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return

    setIsLoading(true)

    try {
      // 1. Create auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
            account_type: formData.accountType,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (signUpError) throw signUpError

      if (!authData.user) {
        throw new Error('User creation failed')
      }

      // 2. IMPORTANT: Get a fresh session to ensure auth.uid() works
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !sessionData.session) {
        console.log('No session yet, user needs to verify email first')
        toast.success('Registration successful! Please check your email to verify your account.', {
          duration: 5000,
        })
        router.push('/verify-email')
        return
      }

      // 3. Use service role for profile creation (or use a database function)
      // Since we can't use service role from client, we'll use a different approach

      // Create profile using anon key but with proper RLS
      const profileData: any = {
        id: authData.user.id,
        email: formData.email,
        name: formData.name,
        account_type: formData.accountType,
        registration_completed: false,
        terms_accepted: formData.terms,
        created_by: authData.user.id,
      }

      if (formData.accountType === 'organization') {
        if (!formData.organizationName || !formData.organizationIndustry || !formData.organizationSize) {
          throw new Error('Organization details are required')
        }

        profileData.organization_name = formData.organizationName
        profileData.organization_industry = formData.organizationIndustry
        profileData.organization_size = formData.organizationSize
      }

      const { data: registrationResult, error: registrationError } = await supabase.rpc(
        'handle_new_user_registration',
        {
          user_id: authData.user.id,
          user_email: formData.email,
          user_name: formData.name,
          user_account_type: formData.accountType,
          user_terms_accepted: formData.terms,
          org_name: formData.accountType === 'organization' ? formData.organizationName : undefined,
          org_industry: formData.accountType === 'organization' ? formData.organizationIndustry : undefined,
          org_size: formData.accountType === 'organization' ? formData.organizationSize : undefined,
        }
      )
      if (registrationError) {
        console.error('Registration function error:', registrationError)
        throw new Error(`Failed to complete registration: ${registrationError.message}`)
      }

      toast.success('Registration successful! Please check your email to verify your account.', {
        duration: 5000,
      })

      router.push('/verify-email')
    } catch (err: any) {
      console.error('Registration error:', err)
      toast.error(err.message || 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const getPasswordStrengthColor = () => {
    if (passwordStrength >= 75) return 'bg-success'
    if (passwordStrength >= 50) return 'bg-warning'
    return 'bg-error'
  }

  const getPasswordStrengthText = () => {
    if (passwordStrength >= 75) return 'Strong'
    if (passwordStrength >= 50) return 'Medium'
    if (passwordStrength > 0) return 'Weak'
    return ''
  }

  const getStepCount = () => {
    return formData.accountType === 'individual' ? 3 : 4
  }

  const getCurrentStepForDisplay = () => {
    if (formData.accountType === 'individual' && currentStep === 4) {
      return 3
    }
    return currentStep
  }

  const isCurrentStepSubmit = () => {
    return currentStep === (formData.accountType === 'individual' ? 4 : 4)
  }

  const getButtonText = () => {
    if (isCurrentStepSubmit()) {
      return 'Create Account'
    }
    return 'Continue'
  }

  // Step 1: Account Type Selection
  const renderAccountTypeStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          Choose your account type
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Select the option that best fits your needs
        </p>
      </div>

      <SocialAuthButtons showGithub={false} />

      <div className="flex items-center my-6">
        <div className="flex-grow border-t border-border"></div>
        <span className="px-4 text-sm text-muted-foreground font-medium">or</span>
        <div className="flex-grow border-t border-border"></div>
      </div>

      <div className="space-y-4">
        {accountTypes.map((type) => (
          <div
            key={type.value}
            onClick={() => handleInputChange('accountType', type.value)}
            className={`relative p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${formData.accountType === type.value
              ? 'border-primary bg-primary/5 shadow-glow-sm'
              : 'border-border hover:border-muted-foreground hover:shadow-md'
              }`}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-muted flex-shrink-0">
                <type.icon className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  {type.label}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {type.description}
                </p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${formData.accountType === type.value
                ? 'border-primary bg-primary'
                : 'border-border'
                }`}>
                {formData.accountType === type.value && (
                  <CheckCircle2 className="w-5 h-5 text-primary-foreground -m-0.5" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {errors.accountType && (
        <p className="text-sm text-error text-center">{errors.accountType}</p>
      )}
    </div>
  )

  // Step 2: Basic Information
  const renderBasicInfoStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          Basic Information
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Tell us a bit about yourself
        </p>
      </div>

      <div className="space-y-4">
        <Input
          label="Full Name"
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="John Doe"
          leftIcon={<User className="h-5 w-5" />}
          className="h-12 text-base"
          required
          autoComplete="name"
          error={errors.name}
        />

        <Input
          label="Email Address"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder={formData.accountType === 'organization' ? 'name@yourcompany.com' : 'you@example.com'}
          leftIcon={<Mail className="h-5 w-5" />}
          className="h-12 text-base"
          required
          autoComplete="email"
          error={errors.email}
        />
        {formData.accountType === 'organization' && formData.email && isCommonEmailProvider(formData.email) && (
          <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              💡 Organization accounts require a custom domain email. Please use your company email address (e.g., name@yourcompany.com) instead of a public email provider.
            </p>
          </div>
        )}
      </div>
    </div>
  )

  // Step 3: Organization Details (only for organization accounts)
  const renderOrganizationInfoStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          Organization Details
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Help us set up your organization
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="organizationName" className="text-sm font-medium text-foreground block mb-2">
            Organization Name <span className="text-error">*</span>
          </label>
          <input
            type="text"
            id="organizationName"
            name="organizationName"
            value={formData.organizationName}
            onChange={handleChange}
            className={`w-full px-4 py-3 border ${errors.organizationName ? 'border-error' : 'border-input'} rounded-lg bg-background text-foreground placeholder-muted-foreground transition-all duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/10`}
            placeholder="Enter your organization name"
            required
          />
          {errors.organizationName && (
            <p className="text-sm text-error mt-1">{errors.organizationName}</p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-foreground block mb-2">
            Industry <span className="text-error">*</span>
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsIndustryDropdownOpen(!isIndustryDropdownOpen)}
              className={`w-full px-4 py-3 border ${errors.organizationIndustry ? 'border-error' : 'border-input'} rounded-lg text-foreground transition-all duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/10 bg-background text-left flex items-center justify-between`}
            >
              <span className={formData.organizationIndustry ? 'text-foreground' : 'text-muted-foreground'}>
                {industries.find(ind => ind.value === formData.organizationIndustry)?.label || 'Select your industry'}
              </span>
              <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${isIndustryDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isIndustryDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                {industries.map((industry) => (
                  <button
                    key={industry.value}
                    type="button"
                    onClick={() => {
                      handleInputChange('organizationIndustry', industry.value)
                      setIsIndustryDropdownOpen(false)
                    }}
                    className={`w-full px-4 py-2.5 text-left hover:bg-muted transition-colors duration-200 ${formData.organizationIndustry === industry.value ? 'bg-primary/5 text-primary font-medium' : 'text-card-foreground'
                      }`}
                  >
                    {industry.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {errors.organizationIndustry && (
            <p className="text-sm text-error mt-1">{errors.organizationIndustry}</p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-foreground block mb-2">
            Organization Size
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsSizeDropdownOpen(!isSizeDropdownOpen)}
              className="w-full px-4 py-3 border border-input rounded-lg text-foreground transition-all duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/10 bg-background text-left flex items-center justify-between"
            >
              <span>
                {organizationSizes.find(size => size.value === formData.organizationSize)?.label}
              </span>
              <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${isSizeDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isSizeDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-10">
                {organizationSizes.map((size) => (
                  <button
                    key={size.value}
                    type="button"
                    onClick={() => {
                      handleInputChange('organizationSize', size.value)
                      setIsSizeDropdownOpen(false)
                    }}
                    className={`w-full px-4 py-2.5 text-left hover:bg-muted transition-colors duration-200 ${formData.organizationSize === size.value ? 'bg-primary/5 text-primary font-medium' : 'text-card-foreground'
                      }`}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  // Step 4: Password & Terms
  const renderPasswordTermsStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          Security & Terms
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Create your password and agree to our terms
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Create a strong password"
            leftIcon={<Lock className="h-5 w-5" />}
            className="h-12 text-base"
            required
            autoComplete="new-password"
            error={errors.password}
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

          {formData.password && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Password strength:</span>
                <span className={`font-medium ${passwordStrength >= 75 ? 'text-success' :
                  passwordStrength >= 50 ? 'text-warning' : 'text-error'
                  }`}>
                  {getPasswordStrengthText()}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                  style={{ width: `${passwordStrength}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <Input
          label="Confirm Password"
          type={showPassword ? 'text' : 'password'}
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Re-enter your password"
          leftIcon={<Lock className="h-5 w-5" />}
          className="h-12 text-base"
          required
          autoComplete="new-password"
          error={errors.confirmPassword}
        />

        <label className="flex items-start cursor-pointer group">
          <input
            type="checkbox"
            name="terms"
            checked={formData.terms}
            onChange={handleChange}
            className="mt-1 w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer flex-shrink-0"
            required
          />
          <span className="ml-3 text-sm text-muted-foreground group-hover:text-foreground transition-colors select-none">
            I agree to the{' '}
            <Link href="/terms" className="text-primary hover:text-primary/80 font-medium">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-primary hover:text-primary/80 font-medium">
              Privacy Policy
            </Link>
          </span>
        </label>
        {errors.terms && (
          <p className="text-sm text-error">{errors.terms}</p>
        )}
      </div>
    </div>
  )

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderAccountTypeStep()
      case 2:
        return renderBasicInfoStep()
      case 3:
        return renderOrganizationInfoStep()
      case 4:
        return renderPasswordTermsStep()
      default:
        return renderAccountTypeStep()
    }
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Header with Back Button */}
      {currentStep > 1 && (
        <div className="relative">
          <button
            type="button"
            onClick={prevStep}
            disabled={isLoading || stepLoading}
            className="p-2.5 bg-card border border-border rounded-lg shadow-sm hover:shadow-md hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Current Step Content */}
      {renderCurrentStep()}

      {/* Action Button with Animation */}
      <div className="mt-8">
        <div className="relative flex justify-center">
          <button
            type="button"
            onClick={isCurrentStepSubmit() ? handleSubmit : nextStep}
            disabled={isLoading || stepLoading || Object.values(errors).some(error => error)}
            className={`
              transition-all duration-300 ease-in-out
              ${stepLoading || isLoading
                ? 'w-12 h-12 rounded-full bg-primary shadow-md flex items-center justify-center'
                : 'w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg px-6 py-3 shadow-glow-sm hover:shadow-glow-md hover:-translate-y-0.5'
              }
              disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
            `}
          >
            {stepLoading || isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              getButtonText()
            )}
          </button>
        </div>
      </div>

      {/* Step Progress Indicators */}
      <div className="flex items-center justify-center space-x-2">
        {Array.from({ length: getStepCount() }, (_, i) => i + 1).map((step) => {
          const isActive = getCurrentStepForDisplay() === step
          const isCompleted = getCurrentStepForDisplay() > step

          return (
            <div
              key={step}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${isActive
                ? 'bg-primary scale-125'
                : isCompleted
                  ? 'bg-primary/40'
                  : 'bg-border'
                }`}
            />
          )
        })}
      </div>

      {/* Sign In Link */}
      <div className="pt-6 border-t border-border">
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-primary hover:text-primary/80 font-semibold transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>

      {/* Dropdown overlay */}
      {(isIndustryDropdownOpen || isSizeDropdownOpen) && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => {
            setIsIndustryDropdownOpen(false)
            setIsSizeDropdownOpen(false)
          }}
        />
      )}
    </div>
  )
}

export { RegisterForm }