// ==========================================
// FILE: components/suites/CreateSuiteForm.tsx (FIXED)
// ==========================================
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/providers/SupabaseProvider'
import { toast } from 'sonner'
import { logger } from '@/lib/utils/logger';
import { Loader2, FolderPlus, Building2, User, Info } from 'lucide-react'

interface CreateSuiteFormProps {
  userId: string
  onSuccess?: (suiteId: string) => void
}

export function CreateSuiteForm({ userId, onSuccess }: CreateSuiteFormProps) {
  const router = useRouter()
  const { supabase } = useSupabase()
  const [isLoading, setIsLoading] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [accountType, setAccountType] = useState<'individual' | 'organization' | null>(null)
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [organizationName, setOrganizationName] = useState<string>('')
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })

  useEffect(() => {
    loadUserProfile()
  }, [userId])

  const loadUserProfile = async () => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('account_type, organization_id')
        .eq('id', userId)
        .single()

      if (error) throw error

      setAccountType(profile.account_type as 'individual' | 'organization')
      setOrganizationId(profile.organization_id)

      // If organization account, fetch organization name
      if (profile.account_type === 'organization' && profile.organization_id) {
        const { data: org } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', profile.organization_id)
          .single()

        if (org) {
          setOrganizationName(org.name)
        }
      }
    } catch (error) {
      logger.log('Error loading profile:', error)
      toast.error('Failed to load account information')
    } finally {
      setLoadingProfile(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Please enter a suite name')
      return
    }

    if (formData.name.trim().length < 3) {
      toast.error('Suite name must be at least 3 characters')
      return
    }

    if (!accountType) {
      toast.error('Account type not loaded')
      return
    }

    setIsLoading(true)

    try {
      // Determine owner based on account type
      const ownerType = accountType
      const ownerId = accountType === 'organization' 
        ? (organizationId || userId) 
        : userId

      // Create the test suite
      const { data: suite, error: suiteError } = await supabase
        .from('test_suites')
        .insert({
          name: formData.name.trim(),
          description: formData.description.trim() || '',
          owner_type: ownerType,
          owner_id: ownerId,
          created_by: userId,
          status: 'active',
        })
        .select()
        .single()

      if (suiteError) throw suiteError

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: userId,
        action: 'test_suite_created',
        resource_type: 'test_suite',
        resource_id: suite.id,
        metadata: {
          suite_name: formData.name,
          owner_type: ownerType,
        },
      })

      toast.success('Test suite created successfully! 🎉')

      // Call success callback if provided
      if (onSuccess) {
        onSuccess(suite.id)
      } else {
        // Default behavior: redirect to dashboard
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error: any) {
      logger.log('Error creating suite:', error)
      toast.error(error.message || 'Failed to create test suite')
    } finally {
      setIsLoading(false)
    }
  }

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Account Type Info Banner */}
      <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {accountType === 'organization' ? (
              <Building2 className="w-5 h-5 text-primary mt-0.5" />
            ) : (
              <User className="w-5 h-5 text-primary mt-0.5" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground mb-1">
              {accountType === 'organization' ? 'Organization Suite' : 'Personal Suite'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {accountType === 'organization' 
                ? `This suite will be created for "${organizationName}" and accessible to organization members.`
                : 'This suite will be private to your account.'}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-card rounded-xl shadow-lg border border-border p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <FolderPlus className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Create Test Suite</h2>
            <p className="text-sm text-muted-foreground">
              Organize your test cases in a suite
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Suite Name */}
          <div>
            <label 
              htmlFor="name" 
              className="block text-sm font-medium text-foreground mb-2"
            >
              Suite Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Web App Testing, Mobile QA, API Tests"
              className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
              required
              minLength={3}
              maxLength={100}
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Choose a descriptive name for your test suite
            </p>
          </div>

          {/* Description */}
          <div>
            <label 
              htmlFor="description" 
              className="block text-sm font-medium text-foreground mb-2"
            >
              Description <span className="text-muted-foreground text-xs">(Optional)</span>
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of what you'll test in this suite..."
              rows={4}
              className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/10 transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
              maxLength={500}
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Help your team understand the purpose of this suite
            </p>
          </div>

          {/* Info Box */}
          <div className="flex items-start gap-3 p-4 bg-muted/50 border border-border rounded-lg">
            <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">What's a test suite?</p>
              <p>
                A test suite is a collection of test cases organized together. 
                You can create multiple suites to organize tests by feature, platform, or project.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading || !formData.name.trim()}
              className="w-full px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Creating Suite...</span>
                </>
              ) : (
                <>
                  <FolderPlus className="w-5 h-5" />
                  <span>Create Test Suite</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Help Text */}
      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          You can create as many test suites as you need to organize your tests
        </p>
      </div>
    </div>
  )
}