// ============================================
// FILE: app/onboarding/page.tsx (MODERNIZED)
// ============================================
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/providers/SupabaseProvider'
import { setCurrentSuite } from '@/lib/suites/session'
import { toast } from 'sonner'
import { logger } from '@/lib/utils/logger'
import {
  Building2, Globe, Users, Loader2, CheckCircle2,
  ArrowRight, Folder, X, Plus, ArrowLeft
} from 'lucide-react'

export default function OnboardingPage() {
  const router = useRouter()
  const { supabase } = useSupabase()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [currentStep, setCurrentStep] = useState(1)

  const [formData, setFormData] = useState({
    organizationWebsite: '',
    organizationDescription: '',
    inviteEmails: [''],
    suiteName: '',
    suiteDescription: '',
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error

      setProfile(profileData)

      if (profileData.registration_completed) {
        logger.log('✅ Onboarding already complete, redirecting to dashboard')
        router.push('/dashboard')
        return
      }

      if (profileData.organization_website) {
        setFormData(prev => ({
          ...prev,
          organizationWebsite: profileData.organization_website || '',
        }))
      }

      if (profileData.account_type === 'individual') {
        setCurrentStep(1)
      } else {
        setCurrentStep(1)
      }

    } catch (error) {
      logger.log('Error loading profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAddEmail = () => {
    setFormData(prev => ({
      ...prev,
      inviteEmails: [...prev.inviteEmails, ''],
    }))
  }

  const handleRemoveEmail = (index: number) => {
    setFormData(prev => ({
      ...prev,
      inviteEmails: prev.inviteEmails.filter((_, i) => i !== index),
    }))
  }

  const handleEmailChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      inviteEmails: prev.inviteEmails.map((email, i) =>
        i === index ? value : email
      ),
    }))
  }

  const handleOrgDetailsSubmit = async () => {
    if (!formData.organizationWebsite && !formData.organizationDescription) {
      toast.error('Please provide at least website or description')
      return
    }

    try {
      setSaving(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const updateData: any = {}

      if (formData.organizationWebsite) {
        updateData.organization_website = formData.organizationWebsite
      }

      if (formData.organizationDescription) {
        updateData.metadata = {
          organization_description: formData.organizationDescription
        }
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)

      if (profileError) throw profileError

      toast.success('Organization details saved!')
      setCurrentStep(2)
    } catch (error: any) {
      toast.error(error.message || 'Failed to save details')
    } finally {
      setSaving(false)
    }
  }

  const handleInvitationsSubmit = async () => {
    try {
      setSaving(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const validEmails = formData.inviteEmails.filter(email =>
        email && /\S+@\S+\.\S+/.test(email)
      )

      if (validEmails.length > 0 && profile?.organization_id) {
        const invitations = validEmails.map(email => ({
          type: 'organization',
          organization_id: profile.organization_id,
          invitee_email: email,
          invited_by: user.id,
          role: 'member',
          status: 'pending',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }))

        const { error: inviteError } = await supabase
          .from('invitations')
          .insert(invitations)

        if (inviteError) {
          logger.log('Invitation error:', inviteError)
          toast.error('Some invitations failed to send')
        } else {
          toast.success(`Sent ${validEmails.length} invitation${validEmails.length > 1 ? 's' : ''}!`)
        }
      }

      setCurrentStep(3)
    } catch (error: any) {
      toast.error(error.message || 'Failed to send invitations')
    } finally {
      setSaving(false)
    }
  }

  const handleSuiteCreation = async () => {
    if (!formData.suiteName.trim()) {
      toast.error('Test suite name is required')
      return
    }

    if (formData.suiteName.trim().length < 3) {
      toast.error('Suite name must be at least 3 characters')
      return
    }

    try {
      setSaving(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const ownerType = profile?.account_type === 'organization' ? 'organization' : 'individual'
      const ownerId = ownerType === 'organization'
        ? (profile.organization_id || user.id)
        : user.id

      logger.log('Creating suite with:', { ownerType, ownerId, userId: user.id })

      const suiteData: any = {
        name: formData.suiteName.trim(),
        description: formData.suiteDescription.trim() || '',
        owner_type: ownerType,
        owner_id: ownerId,
        created_by: user.id,
        status: 'active',
      }

      if (ownerType === 'organization') {
        suiteData.admins = [user.id]
        suiteData.members = [user.id]
      }

      const { data: suite, error: suiteError } = await supabase
        .from('test_suites')
        .insert(suiteData)
        .select()
        .single()

      if (suiteError) {
        logger.log('Suite creation error:', suiteError)
        throw suiteError
      }

      logger.log('✅ Suite created successfully:', suite)

      await setCurrentSuite(suite.id)
      logger.log('✅ Set current suite in session:', suite.id)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ registration_completed: true })
        .eq('id', user.id)

      if (updateError) {
        logger.log('Profile update error:', updateError)
        throw updateError
      }

      await supabase.from('activity_logs').insert({
        user_id: user.id,
        action: 'onboarding_completed',
        resource_type: 'test_suite',
        resource_id: suite.id,
        metadata: {
          suite_name: formData.suiteName,
          account_type: profile.account_type,
        },
      })

      toast.success('Welcome to Surely! 🎉', {
        description: 'Your workspace is ready!'
      })

      router.push('/dashboard')
      router.refresh()
    } catch (error: any) {
      logger.log('Suite creation error:', error)
      toast.error(error.message || 'Failed to create test suite')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const isOrganization = profile?.account_type === 'organization'
  const totalSteps = isOrganization ? 3 : 1
  const userEmail = profile?.email || ''
  const orgDomain = userEmail.split('@')[1] || ''

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/5 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3 animate-in fade-in slide-in-from-top-2 duration-500">
            Welcome to Surely! 👋
          </h1>
          <p className="text-muted-foreground animate-in fade-in slide-in-from-top-2 duration-500 delay-100">
            {isOrganization ? "Let's get your team set up" : "Let's create your workspace"}
          </p>
        </div>

        {/* Progress Bar */}
        {totalSteps > 1 && (
          <div className="mb-6 animate-in fade-in duration-500 delay-200">
            <div className="flex items-center gap-2">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full flex-1 transition-all duration-500 ${
                    currentStep > index ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Step {currentStep} of {totalSteps}
            </p>
          </div>
        )}

        {/* Card */}
        <div className="bg-card rounded-xl shadow-lg border border-border p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-500 delay-300">
          {/* Back Button */}
          {currentStep > 1 && isOrganization && (
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back
            </button>
          )}

          {/* ORG STEP 1: Organization Details */}
          {currentStep === 1 && isOrganization && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">
                    Organization Details
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Tell us about your organization
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    Website
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="url"
                      placeholder="https://yourcompany.com"
                      value={formData.organizationWebsite}
                      onChange={(e) => handleInputChange('organizationWebsite', e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-input rounded-lg bg-background text-foreground placeholder-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    Description
                  </label>
                  <textarea
                    placeholder="What does your organization do?"
                    value={formData.organizationDescription}
                    onChange={(e) => handleInputChange('organizationDescription', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-input rounded-lg bg-background text-foreground placeholder-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setCurrentStep(2)}
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 border border-border rounded-lg font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all disabled:opacity-50"
                >
                  Skip
                </button>
                <button
                  onClick={handleOrgDetailsSubmit}
                  disabled={saving}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ORG STEP 2: Team Invitations */}
          {currentStep === 2 && isOrganization && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">
                    Invite Your Team
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Add teammates to collaborate (optional)
                </p>
              </div>

              <div className="space-y-3">
                {formData.inviteEmails.map((email, index) => (
                  <div key={index} className="flex gap-2 animate-in fade-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${index * 50}ms` }}>
                    <div className="flex-1 relative">
                      <input
                        type="email"
                        placeholder={`teammate${index > 0 ? index + 1 : ''}@${orgDomain || 'company.com'}`}
                        value={email}
                        onChange={(e) => handleEmailChange(index, e.target.value)}
                        className="w-full px-4 py-2.5 border border-input rounded-lg bg-background text-foreground placeholder-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                      {email && /\S+@\S+\.\S+/.test(email) && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              email.endsWith(`@${orgDomain}`) ? 'bg-success animate-pulse' : 'bg-warning'
                            }`}
                          />
                        </div>
                      )}
                    </div>
                    {formData.inviteEmails.length > 1 && (
                      <button
                        onClick={() => handleRemoveEmail(index)}
                        className="p-2.5 border border-border rounded-lg text-muted-foreground hover:text-error hover:border-error hover:bg-error/5 transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  onClick={handleAddEmail}
                  className="w-full px-4 py-2.5 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all font-medium flex items-center justify-center gap-2 group"
                >
                  <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  Add teammate
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setCurrentStep(3)}
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 border border-border rounded-lg font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all disabled:opacity-50"
                >
                  Skip
                </button>
                <button
                  onClick={handleInvitationsSubmit}
                  disabled={saving}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* FINAL STEP: Create Test Suite */}
          {((currentStep === 3 && isOrganization) || (currentStep === 1 && !isOrganization)) && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Folder className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">
                    Create Your First Suite
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  A suite organizes your test cases
                </p>
              </div>

              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg animate-in fade-in zoom-in-95 duration-500 delay-200">
                <div className="flex items-center gap-2 text-sm font-medium text-primary mb-1">
                  <CheckCircle2 className="w-4 h-4" />
                  {isOrganization ? 'Team Suite' : 'Personal Suite'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isOrganization
                    ? 'Shared with your organization'
                    : 'Private to your account'}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    Suite Name <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Web Testing, API Tests, Mobile QA"
                    value={formData.suiteName}
                    onChange={(e) => handleInputChange('suiteName', e.target.value)}
                    className="w-full px-4 py-2.5 border border-input rounded-lg bg-background text-foreground placeholder-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    Description
                  </label>
                  <textarea
                    placeholder="What will you test in this suite?"
                    value={formData.suiteDescription}
                    onChange={(e) => handleInputChange('suiteDescription', e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2.5 border border-input rounded-lg bg-background text-foreground placeholder-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                  />
                </div>
              </div>

              <button
                onClick={handleSuiteCreation}
                disabled={saving || !formData.suiteName.trim()}
                className="btn-primary w-full flex items-center justify-center gap-2 group"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating workspace...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    Complete Setup
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6 animate-in fade-in duration-500 delay-500">
          You can update these settings anytime in your dashboard
        </p>
      </div>
    </div>
  )
}