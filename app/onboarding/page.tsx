// ============================================
// FILE: app/onboarding/page.tsx
// ============================================
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/providers/SupabaseProvider'
import { toast } from 'sonner'
import { 
  Building2, Globe, Users, Loader2, CheckCircle2, 
  ArrowRight, Sparkles, Folder, Mail, X, Plus, Check, ChevronDown
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

      // Pre-fill data if exists
      if (profileData.organization_website) {
        setFormData(prev => ({
          ...prev,
          organizationWebsite: profileData.organization_website || '',
        }))
      }

    } catch (error) {
      console.error('Error loading profile:', error)
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

  const handleSkipInvites = () => {
    if (profile?.account_type === 'organization') {
      setCurrentStep(3) // Skip to test suite creation
    }
  }

  const handleStep1Submit = async () => {
    if (!formData.organizationWebsite && !formData.organizationDescription) {
      toast.error('Please provide at least website or description')
      return
    }

    try {
      setSaving(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Update profile with additional details
      const updateData: any = {}
      
      if (formData.organizationWebsite) {
        updateData.organization_website = formData.organizationWebsite
      }
      
      // Store description in profile metadata since organizations table doesn't have description field
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

  const handleStep2Submit = async () => {
    try {
      setSaving(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Filter valid emails
      const validEmails = formData.inviteEmails.filter(email => 
        email && /\S+@\S+\.\S+/.test(email)
      )

      // Send invitations
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
          console.error('Invitation error:', inviteError)
          toast.error('Some invitations failed to send')
        } else {
          toast.success(`Sent ${validEmails.length} invitation${validEmails.length > 1 ? 's' : ''}!`)
        }
      }

      // Move to test suite creation
      setCurrentStep(3)
    } catch (error: any) {
      toast.error(error.message || 'Failed to send invitations')
    } finally {
      setSaving(false)
    }
  }

  const handleStep3Submit = async () => {
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

      // Determine owner type and ID
      const ownerType = profile?.account_type === 'organization' ? 'organization' : 'individual'
      const ownerId = ownerType === 'organization' ? profile.organization_id : user.id

      // Create test suite
      const { data: suiteData, error: suiteError } = await supabase
        .from('test_suites')
        .insert({
          name: formData.suiteName.trim(),
          description: formData.suiteDescription.trim() || '',
          owner_type: ownerType,
          owner_id: ownerId,
          created_by: user.id,
          status: 'active',
        })
        .select()
        .single()

      if (suiteError) throw suiteError

      // Mark onboarding complete
      await supabase
        .from('profiles')
        .update({ registration_completed: true })
        .eq('id', user.id)

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        action: 'onboarding_completed',
        resource_type: 'test_suite',
        resource_id: suiteData.id,
        metadata: {
          suite_name: formData.suiteName,
          account_type: profile.account_type,
        },
      })

      toast.success('Welcome to Surely! 🎉')
      router.push('/dashboard')
    } catch (error: any) {
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
  const totalSteps = isOrganization ? 3 : 2
  const userEmail = profile?.email || ''
  const orgDomain = userEmail.split('@')[1] || ''

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Welcome to Surely! 🎉
          </h1>
          <p className="text-muted-foreground text-lg">
            {isOrganization ? "Let's set up your organization" : "Let's set up your account"}
          </p>
        </div>

        {/* Progress Indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full transition-all ${
                currentStep > index + 1 
                  ? 'bg-success scale-125' 
                  : currentStep === index + 1 
                  ? 'bg-primary scale-125' 
                  : 'bg-border'
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl shadow-xl border border-border p-6 sm:p-8">
          {/* Step 1: Organization Details (Organizations only) */}
          {currentStep === 1 && isOrganization && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  Organization Details
                </h2>
                <p className="text-sm text-muted-foreground">
                  Help us know more about your organization
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    Website (Optional)
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="url"
                      placeholder="https://yourcompany.com"
                      value={formData.organizationWebsite}
                      onChange={(e) => handleInputChange('organizationWebsite', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-input rounded-lg bg-background text-foreground focus:border-primary focus:ring-2 focus:ring-ring/10 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    placeholder="Tell us what your organization does..."
                    value={formData.organizationDescription}
                    onChange={(e) => handleInputChange('organizationDescription', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:border-primary focus:ring-2 focus:ring-ring/10 transition-all resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setCurrentStep(2)}
                  disabled={saving}
                  className="flex-1 px-6 py-3 border border-border rounded-lg font-medium text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
                >
                  Skip for now
                </button>
                <button
                  onClick={handleStep1Submit}
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Team Invitations (Organizations only) */}
          {currentStep === 2 && isOrganization && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Invite Your Team
                </h2>
                <p className="text-sm text-muted-foreground">
                  Collaborate with your team members (optional)
                </p>
              </div>

              <div className="space-y-3">
                {formData.inviteEmails.map((email, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        type="email"
                        placeholder="teammate@yourcompany.com"
                        value={email}
                        onChange={(e) => handleEmailChange(index, e.target.value)}
                        className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:border-primary focus:ring-2 focus:ring-ring/10 transition-all"
                      />
                      {email && email.includes('@') && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              email.endsWith(`@${orgDomain}`) ? 'bg-success' : 'bg-warning'
                            }`}
                            title={email.endsWith(`@${orgDomain}`) ? 'Internal' : 'External'}
                          />
                        </div>
                      )}
                    </div>
                    {formData.inviteEmails.length > 1 && (
                      <button
                        onClick={() => handleRemoveEmail(index)}
                        className="px-3 py-3 border border-border rounded-lg text-muted-foreground hover:text-error hover:border-error transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  onClick={handleAddEmail}
                  className="w-full px-4 py-3 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:border-primary hover:text-primary transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add another email
                </button>
              </div>

              {formData.inviteEmails.some(e => e.includes('@')) && (
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-success rounded-full" />
                    <span>Internal ({orgDomain})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-warning rounded-full" />
                    <span>External</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSkipInvites}
                  disabled={saving}
                  className="flex-1 px-6 py-3 border border-border rounded-lg font-medium text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
                >
                  Skip for now
                </button>
                <button
                  onClick={handleStep2Submit}
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Create Test Suite (Required for all) */}
          {((currentStep === 3 && isOrganization) || (currentStep === 1 && !isOrganization)) && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <Folder className="w-5 h-5 text-primary" />
                  Create Your First Test Suite
                </h2>
                <p className="text-sm text-muted-foreground">
                  Required to access your dashboard
                </p>
              </div>

              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-primary mb-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-medium">
                    {isOrganization ? 'Organization Suite' : 'Personal Suite'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {isOrganization
                    ? 'This suite will be accessible to your organization members'
                    : 'This suite will be private to your account'}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    Suite Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Web App Testing, Mobile QA, API Tests"
                    value={formData.suiteName}
                    onChange={(e) => handleInputChange('suiteName', e.target.value)}
                    className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:border-primary focus:ring-2 focus:ring-ring/10 transition-all"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    placeholder="Brief description of what you'll test in this suite..."
                    value={formData.suiteDescription}
                    onChange={(e) => handleInputChange('suiteDescription', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:border-primary focus:ring-2 focus:ring-ring/10 transition-all resize-none"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleStep3Submit}
                  disabled={saving}
                  className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Complete Setup & Go to Dashboard</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          You can always update these settings later in your dashboard
        </p>
      </div>
    </div>
  )
}