// ============================================
// InviteMemberPortal.tsx - FIXED
// Individual role selection per invitee
// ============================================
'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Loader2, X, Shield, Users, Mail, AlertCircle, Plus, Eye } from 'lucide-react'

interface Invitee {
  email: string
  role: 'admin' | 'member' | 'viewer'
}

interface InviteMemberPortalProps {
  suiteId: string
  userId: string
  accountType: 'individual' | 'organization'
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  organizationDomain?: string
  organizationId?: string
}

const ROLE_OPTIONS = [
  {
    value: 'admin' as const,
    label: 'Admin',
    icon: Shield,
    description: 'Full access to suite settings'
  },
  {
    value: 'member' as const,
    label: 'Member',
    icon: Users,
    description: 'Can view and contribute'
  },
  {
    value: 'viewer' as const,
    label: 'Viewer',
    icon: Eye,
    description: 'View-only access'
  }
]

export function InviteMemberPortal({ 
  suiteId, 
  isOpen, 
  onClose, 
  onSuccess,
  organizationDomain,
  organizationId
}: InviteMemberPortalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [invitees, setInvitees] = useState<Invitee[]>([{ email: '', role: 'member' }])
  const [showExternalWarning, setShowExternalWarning] = useState(false)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const isExternalEmail = (emailToCheck: string) => {
    if (!organizationDomain) return false
    return !emailToCheck.trim().toLowerCase().endsWith(`@${organizationDomain}`)
  }

  const handleAddField = () => {
    setInvitees([...invitees, { email: '', role: 'member' }])
  }

  const handleRemoveField = (index: number) => {
    if (invitees.length > 1) {
      setInvitees(invitees.filter((_, i) => i !== index))
    }
  }

  const handleEmailChange = (index: number, email: string) => {
    const updated = [...invitees]
    updated[index].email = email
    setInvitees(updated)
  }

  const handleRoleChange = (index: number, role: 'admin' | 'member' | 'viewer') => {
    const updated = [...invitees]
    updated[index].role = role
    setInvitees(updated)
  }

  const validateEmails = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const filledInvitees = invitees.filter(inv => inv.email.trim())
    
    if (filledInvitees.length === 0) {
      toast.error('Please enter at least one email address')
      return false
    }

    for (const inv of filledInvitees) {
      if (!emailRegex.test(inv.email.trim())) {
        toast.error(`Invalid email: ${inv.email}`)
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateEmails()) return

    const filledInvitees = invitees.filter(inv => inv.email.trim())

    // Check for external emails
    if (organizationDomain) {
      const external = filledInvitees.filter(inv => isExternalEmail(inv.email))
      if (external.length > 0 && !showExternalWarning) {
        setShowExternalWarning(true)
        return
      }
    }

    await sendInvites(filledInvitees)
  }

  const sendInvites = async (inviteList: Invitee[]) => {
    setIsLoading(true)
    try {
      let sent = 0, failed = 0, alreadyInvited = 0
      const failedInvitees: Invitee[] = []

      for (const invitee of inviteList) {
        try {
          const response = await fetch('/api/send-invite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'testSuite',
              email: invitee.email.trim().toLowerCase(),
              suiteId,
              role: invitee.role,
              organizationId,
            }),
          })

          const result = await response.json()

          if (response.ok) {
            sent++
          } else if (response.status === 409) {
            alreadyInvited++
          } else {
            failed++
            failedInvitees.push(invitee)
            console.error(`Failed to invite ${invitee.email}:`, result.error)
          }
        } catch (error: any) {
          console.error('Error sending invite to', invitee.email, ':', error)
          failed++
          failedInvitees.push(invitee)
        }
      }

      if (sent > 0 && failed === 0 && alreadyInvited === 0) {
        toast.success(`${sent} invitation${sent !== 1 ? 's' : ''} sent! 🎉`)
        setInvitees([{ email: '', role: 'member' }])
        setShowExternalWarning(false)
        if (onSuccess) onSuccess()
        onClose()
      } else if (sent > 0) {
        let message = `Sent ${sent} invitation${sent !== 1 ? 's' : ''}`
        if (alreadyInvited > 0) message += `, ${alreadyInvited} already invited`
        if (failed > 0) message += `, ${failed} failed`
        toast.warning(message, {
          description: failed > 0 ? 'Check the remaining emails and try again' : undefined
        })
        setInvitees(failedInvitees.length > 0 ? failedInvitees : [{ email: '', role: 'member' }])
      } else if (alreadyInvited > 0 && failed === 0) {
        toast.info(`${alreadyInvited} email${alreadyInvited !== 1 ? 's' : ''} already invited`)
        setInvitees([{ email: '', role: 'member' }])
        setShowExternalWarning(false)
        if (onSuccess) onSuccess()
        onClose()
      } else {
        toast.error('All invitations failed', {
          description: 'Please check the emails and try again'
        })
        setInvitees(failedInvitees.length > 0 ? failedInvitees : invitees)
      }

    } catch (error: any) {
      console.error('Error sending invites:', error)
      toast.error(error.message || 'Failed to send invitations')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setInvitees([{ email: '', role: 'member' }])
      setShowExternalWarning(false)
      onClose()
    }
  }

  const handleCancelWarning = () => {
    setShowExternalWarning(false)
  }

  const handleProceedWithExternal = () => {
    setShowExternalWarning(false)
    const filledInvitees = invitees.filter(inv => inv.email.trim())
    sendInvites(filledInvitees)
  }

  const filledCount = invitees.filter(inv => inv.email.trim()).length
  const externalInvitees = invitees.filter(inv => inv.email.trim() && isExternalEmail(inv.email))

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={handleClose}
      />

      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        <div className="bg-card border border-border rounded-2xl shadow-theme-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Invite Team Members</h2>
                <p className="text-xs text-muted-foreground">Send invitations via email</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="p-2 rounded-lg hover:bg-muted/50 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          <div className="px-6 py-5">
            {/* External Email Warning */}
            {showExternalWarning && (
              <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200 mb-1">
                      External Emails Detected
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-2">
                      {externalInvitees.length} email{externalInvitees.length !== 1 ? 's are' : ' is'} outside your organization domain
                      {organizationDomain && ` (@${organizationDomain})`}:
                    </p>
                    <div className="mb-3 space-y-1">
                      {externalInvitees.map((inv, idx) => (
                        <div key={idx} className="text-xs text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                          <span>{inv.email}</span>
                          <span className="text-yellow-600">({inv.role})</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCancelWarning}
                        className="px-3 py-1.5 text-xs font-medium text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/30 rounded hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleProceedWithExternal}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-yellow-600 rounded hover:bg-yellow-700 transition-colors"
                      >
                        Send Anyway
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <form id="invite-form" onSubmit={handleSubmit} className="space-y-5">
              {/* Header with count and add button */}
              <div className="flex justify-between items-center">
                {filledCount > 0 && (
                  <span className="text-xs sm:text-sm text-muted-foreground inline-flex items-center gap-1">
                    <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
                    {filledCount} invitee{filledCount !== 1 ? 's' : ''}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleAddField}
                  className="ml-auto inline-flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium text-primary bg-primary/10 border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Person</span>
                </button>
              </div>

              {/* Invitee List */}
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {invitees.map((invitee, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {/* Email Input */}
                    <div className="flex-1 relative">
                      <input
                        type="email"
                        placeholder="colleague@company.com"
                        value={invitee.email}
                        onChange={(e) => handleEmailChange(index, e.target.value)}
                        className="w-full px-4 py-2.5 text-sm border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/10 transition-all disabled:opacity-50"
                        disabled={isLoading}
                      />
                      {invitee.email && invitee.email.includes("@") && organizationDomain && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div 
                            className={`w-2 h-2 rounded-full ${
                              isExternalEmail(invitee.email) ? 'bg-yellow-400' : 'bg-green-400'
                            }`} 
                            title={isExternalEmail(invitee.email) ? 'External' : 'Internal'}
                          />
                        </div>
                      )}
                    </div>

                    {/* Role Dropdown */}
                    <div className="w-48 relative">
                      <select
                        value={invitee.role}
                        onChange={(e) => handleRoleChange(index, e.target.value as 'admin' | 'member' | 'viewer')}
                        className="w-full px-4 py-2.5 text-sm border border-input rounded-lg bg-background text-foreground focus:border-primary focus:ring-2 focus:ring-ring/10 transition-all disabled:opacity-50 appearance-none cursor-pointer"
                        disabled={isLoading}
                      >
                        {ROLE_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {/* Remove Button */}
                    {invitees.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveField(index)}
                        className="p-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors flex-shrink-0"
                        title="Remove this person"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Legend */}
              {invitees.some(inv => inv.email.includes("@")) && organizationDomain && (
                <div className="pt-2 border-t border-border flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                    <span>Internal ({organizationDomain})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                    <span>External</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="px-6 py-2.5 bg-muted/50 text-foreground font-medium rounded-lg hover:bg-muted transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || filledCount === 0}
                  className="px-6 py-2.5 btn-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <span>Send {filledCount > 0 ? `${filledCount} ` : ''}Invite{filledCount !== 1 ? 's' : ''}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}