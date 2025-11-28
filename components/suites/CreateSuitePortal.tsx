// ==========================================
// FILE: components/suites/CreateSuitePortal.tsx
// ==========================================
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/providers/SupabaseProvider'
import { toast } from 'sonner'
import { Loader2, FolderPlus, Building2, User, X } from 'lucide-react'

interface CreateSuitePortalProps {
  userId: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: (suiteId: string) => void
}

export function CreateSuitePortal({ userId, isOpen, onClose, onSuccess }: CreateSuitePortalProps) {
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
    if (isOpen) {
      loadUserProfile()
      // Prevent body scroll when portal is open
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Reset loading state when userId changes
  useEffect(() => {
    if (userId) {
      setLoadingProfile(true)
    }
  }, [userId])

  const loadUserProfile = async () => {
    if (!userId) {
      console.error('No userId provided')
      setLoadingProfile(false)
      return
    }

    setLoadingProfile(true)
    
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('account_type, organization_id')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Profile fetch error:', error)
        throw error
      }

      console.log('Profile loaded:', profile) // Debug log

      setAccountType(profile.account_type as 'individual' | 'organization')
      setOrganizationId(profile.organization_id)

      if (profile.account_type === 'organization' && profile.organization_id) {
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', profile.organization_id)
          .single()

        if (orgError) {
          console.error('Organization fetch error:', orgError)
        }

        if (org) {
          setOrganizationName(org.name)
          console.log('Organization loaded:', org.name) // Debug log
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error)
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
      const ownerType = accountType
      const ownerId = accountType === 'organization' 
        ? (organizationId || userId) 
        : userId

      // FIXED: Add the creator to the admins array
      const { data: suite, error: suiteError } = await supabase
        .from('test_suites')
        .insert({
          name: formData.name.trim(),
          description: formData.description.trim() || '',
          owner_type: ownerType,
          owner_id: ownerId,
          created_by: userId,
          status: 'active',
          admins: [userId], // Add creator as admin
          members: [], // Initialize empty members array
        })
        .select()
        .single()

      if (suiteError) throw suiteError

      // Log the activity
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

      // Reset form
      setFormData({ name: '', description: '' })

      if (onSuccess) {
        onSuccess(suite.id)
      } else {
        router.refresh()
      }

      onClose()
    } catch (error: any) {
      console.error('Error creating suite:', error)
      toast.error(error.message || 'Failed to create test suite')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setFormData({ name: '', description: '' })
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={handleClose}
      />

      {/* Portal Content */}
      <div className="relative w-full max-w-md animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        <div className="bg-card border border-border rounded-2xl shadow-theme-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <FolderPlus className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Create Test Suite</h2>
                <p className="text-xs text-muted-foreground">
                  Organize your test cases
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="p-2 rounded-lg hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-5 max-h-[calc(100vh-12rem)] overflow-y-auto">
            {loadingProfile ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Account Type Badge */}
                <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg">
                  {accountType === 'organization' ? (
                    <Building2 className="w-4 h-4 text-primary flex-shrink-0" />
                  ) : (
                    <User className="w-4 h-4 text-primary flex-shrink-0" />
                  )}
                  <p className="text-xs text-foreground">
                    {accountType === 'organization' 
                      ? `Organization: ${organizationName}`
                      : 'Personal suite'}
                  </p>
                </div>

                {/* Suite Name */}
                <div>
                  <label 
                    htmlFor="suite-name" 
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Suite Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    id="suite-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Web App Testing, Mobile QA"
                    className="w-full px-4 py-2.5 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading}
                    required
                    minLength={3}
                    maxLength={100}
                    autoFocus
                  />
                </div>

                {/* Description */}
                <div>
                  <label 
                    htmlFor="suite-description" 
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Description <span className="text-xs text-muted-foreground">(Optional)</span>
                  </label>
                  <textarea
                    id="suite-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of this test suite..."
                    rows={3}
                    className="w-full px-4 py-2.5 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/10 transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading}
                    maxLength={500}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2.5 bg-muted/50 text-foreground font-medium rounded-lg hover:bg-muted transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !formData.name.trim()}
                    className="flex-1 px-4 py-2.5 btn-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <FolderPlus className="w-4 h-4" />
                        <span>Create</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}