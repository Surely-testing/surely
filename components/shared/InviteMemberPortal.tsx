// ============================================
// InviteMemberPortal.tsx - Complete Fixed Version
// ============================================
'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Loader2, X, Shield, Users, Mail, AlertCircle, Plus, CheckCircle } from 'lucide-react'

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

export function InviteMemberPortal({ 
  suiteId, 
  userId, 
  accountType, 
  isOpen, 
  onClose, 
  onSuccess,
  organizationDomain,
  organizationId
}: InviteMemberPortalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [emails, setEmails] = useState([''])
  const [role, setRole] = useState<'admin' | 'member'>('member')
  const [showExternalWarning, setShowExternalWarning] = useState(false)
  const [externalEmails, setExternalEmails] = useState<string[]>([])
  const [showResultsDialog, setShowResultsDialog] = useState(false)
  const [inviteResults, setInviteResults] = useState<any>(null)

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
    setEmails([...emails, ''])
  }

  const handleRemoveField = (index: number) => {
    if (emails.length > 1) {
      setEmails(emails.filter((_, i) => i !== index))
    }
  }

  const handleChange = (index: number, value: string) => {
    const updatedEmails = [...emails]
    updatedEmails[index] = value
    setEmails(updatedEmails)
  }

  const validateEmails = (emailList: string[]) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailList.every((email) => !email.trim() || emailRegex.test(email.trim()))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const filteredEmails = emails.filter((email) => email.trim())

    if (filteredEmails.length === 0) {
      toast.error('Please enter at least one email address')
      return
    }

    if (!validateEmails(filteredEmails)) {
      toast.error('One or more email addresses are invalid')
      return
    }

    // Check for external emails
    if (organizationDomain) {
      const external = filteredEmails.filter((email) => isExternalEmail(email))
      if (external.length > 0 && !showExternalWarning) {
        setExternalEmails(filteredEmails)
        setShowExternalWarning(true)
        return
      }
    }

    await sendInvites(filteredEmails)
  }

  const sendInvites = async (inviteEmails: string[]) => {
    setIsLoading(true)
    try {
      const results = []
      let sent = 0, failed = 0, alreadyInvited = 0

      for (const email of inviteEmails) {
        try {
          const response = await fetch('/api/send-invite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: email.trim().toLowerCase(),
              suiteId: suiteId,
              role: role,
              organizationId: organizationId,
              organizationDomain: organizationDomain,
            }),
          })

          const result = await response.json()

          if (response.ok) {
            results.push({
              email: email.trim(),
              status: 'sent',
              message: result.message || 'Invitation sent successfully',
            })
            sent++
          } else if (response.status === 409) {
            results.push({
              email: email.trim(),
              status: 'already_invited',
              message: result.error || 'User already has a pending invitation',
            })
            alreadyInvited++
          } else {
            results.push({
              email: email.trim(),
              status: 'failed',
              message: result.error || `Server error: ${response.status}`,
            })
            failed++
          }
        } catch (error: any) {
          console.error('Error sending invite to', email, ':', error)
          results.push({
            email: email.trim(),
            status: 'failed',
            message: `Network error: ${error.message}`,
          })
          failed++
        }
      }

      const finalResult = {
        success: sent > 0 || alreadyInvited > 0,
        results,
        summary: { sent, failed, alreadyInvited }
      }

      setInviteResults(finalResult)

      // Show toast
      if (sent > 0) {
        const msg = `Sent ${sent} invitation${sent !== 1 ? 's' : ''}`
        if (failed > 0 || alreadyInvited > 0) {
          toast.warning(msg + ` (${failed} failed, ${alreadyInvited} already invited)`)
        } else {
          toast.success(msg + '! 🎉')
        }
      } else {
        toast.error('No invitations were sent successfully')
      }

      // Show results dialog if there are failures
      if (failed > 0 || alreadyInvited > 0) {
        setShowResultsDialog(true)
      } else {
        // Close if all successful
        setEmails([''])
        setRole('member')
        setShowExternalWarning(false)
        if (onSuccess) onSuccess()
        onClose()
      }

      // Keep only failed emails in the form
      const failedEmails = results.filter(r => r.status === 'failed').map(r => r.email)
      if (failedEmails.length > 0) {
        setEmails(failedEmails)
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
      setEmails([''])
      setRole('member')
      setShowExternalWarning(false)
      setShowResultsDialog(false)
      setInviteResults(null)
      onClose()
    }
  }

  const handleCancelWarning = () => {
    setShowExternalWarning(false)
  }

  const handleProceedWithExternal = () => {
    setShowExternalWarning(false)
    const filteredEmails = emails.filter((email) => email.trim())
    sendInvites(filteredEmails)
  }

  const filledEmailsCount = emails.filter(email => email.trim()).length
  const externalEmailsList = emails.filter(email => email.trim() && isExternalEmail(email))

  const getStatusIcon = (status: string) => {
    if (status === 'sent') return <CheckCircle className="w-4 h-4 text-green-500" />
    if (status === 'failed') return <AlertCircle className="w-4 h-4 text-red-500" />
    if (status === 'already_invited') return <AlertCircle className="w-4 h-4 text-yellow-500" />
    return null
  }

  const getStatusText = (status: string) => {
    const statuses: Record<string, string> = {
      'sent': 'Sent successfully',
      'failed': 'Failed to send',
      'already_invited': 'Already invited'
    }
    return statuses[status] || status
  }

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
            {/* External Email Warning Dialog */}
            {showExternalWarning && (
              <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200 mb-1">
                      External Emails Detected
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-2">
                      {externalEmailsList.length} email{externalEmailsList.length !== 1 ? 's are' : ' is'} outside your organization domain
                      {organizationDomain && ` (@${organizationDomain})`}:
                    </p>
                    <div className="mb-3 space-y-1">
                      {externalEmailsList.map((email, idx) => (
                        <div key={idx} className="text-xs text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                          <span>{email}</span>
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
              {/* Email Count & Add Button */}
              <div className="flex justify-between items-center">
                {filledEmailsCount > 0 && (
                  <span className="text-xs sm:text-sm text-muted-foreground inline-flex items-center gap-1">
                    <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
                    {filledEmailsCount} email{filledEmailsCount !== 1 ? 's' : ''}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleAddField}
                  className="ml-auto inline-flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium text-primary bg-primary/10 border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Email</span>
                </button>
              </div>

              {/* Email Inputs */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {emails.map((email, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <input
                        type="email"
                        placeholder="colleague@company.com"
                        value={email}
                        onChange={(e) => handleChange(index, e.target.value)}
                        className="w-full px-4 py-2.5 text-sm border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/10 transition-all disabled:opacity-50"
                        disabled={isLoading}
                      />
                      {email && email.includes("@") && organizationDomain && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div 
                            className={`w-2 h-2 rounded-full ${
                              isExternalEmail(email) ? 'bg-yellow-400' : 'bg-green-400'
                            }`} 
                            title={isExternalEmail(email) ? 'External' : 'Internal'}
                          />
                        </div>
                      )}
                    </div>
                    {emails.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveField(index)}
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Legend */}
              {emails.some(e => e.includes("@")) && organizationDomain && (
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

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Role <span className="text-destructive">*</span>
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 border border-input rounded-lg cursor-pointer hover:bg-muted/50 transition-all">
                    <input
                      type="radio"
                      name="role"
                      value="member"
                      checked={role === 'member'}
                      onChange={(e) => setRole(e.target.value as 'member')}
                      className="w-4 h-4 text-primary"
                      disabled={isLoading}
                    />
                    <Users className="w-4 h-4 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Member</p>
                      <p className="text-xs text-muted-foreground">Can view and contribute</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-input rounded-lg cursor-pointer hover:bg-muted/50 transition-all">
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={role === 'admin'}
                      onChange={(e) => setRole(e.target.value as 'admin')}
                      className="w-4 h-4 text-primary"
                      disabled={isLoading}
                    />
                    <Shield className="w-4 h-4 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Admin</p>
                      <p className="text-xs text-muted-foreground">Full access to suite settings</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 bg-muted/50 text-foreground font-medium rounded-lg hover:bg-muted transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || filledEmailsCount === 0}
                  className="flex-1 px-4 py-2.5 btn-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      <span>Send Invites</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Results Dialog */}
      {showResultsDialog && inviteResults && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md w-full max-h-96 overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Invitation Results</h3>
            
            {inviteResults.summary && (
              <div className="flex flex-wrap gap-2 text-xs bg-gray-100 dark:bg-gray-700 p-3 rounded mb-4">
                <span className="text-green-600 font-medium">✓ {inviteResults.summary.sent} sent</span>
                {inviteResults.summary.failed > 0 && (
                  <span className="text-red-600 font-medium">✗ {inviteResults.summary.failed} failed</span>
                )}
                {inviteResults.summary.alreadyInvited > 0 && (
                  <span className="text-yellow-600 font-medium">⚠ {inviteResults.summary.alreadyInvited} already invited</span>
                )}
              </div>
            )}

            <div className="space-y-2 mb-4">
              {inviteResults.results?.map((result: any, idx: number) => (
                <div key={idx} className="flex items-start gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                  <div className="flex-shrink-0 mt-0.5">{getStatusIcon(result.status)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{result.email}</div>
                    <div className="text-gray-600 dark:text-gray-400">{getStatusText(result.status)}</div>
                    {result.message && result.status === 'failed' && (
                      <div className="text-red-600 text-xs mt-1">{result.message}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setShowResultsDialog(false)
                if (inviteResults.summary.failed === 0) {
                  handleClose()
                }
              }}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  )
}