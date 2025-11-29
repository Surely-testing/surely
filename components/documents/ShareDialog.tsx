// ============================================
// FILE: components/documents/ShareDialog.tsx
// ============================================
'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { Share2, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentId: string
  suites: any[]
}

export function ShareDialog({ open, onOpenChange, documentId, suites }: ShareDialogProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('view')
  const [isCopied, setIsCopied] = useState(false)
  const [isSharing, setIsSharing] = useState(false)

  const shareLink = `${window.location.origin}/documents/${documentId}`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink)
      setIsCopied(true)
      toast.success('Link copied to clipboard')
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  const handleInvite = async () => {
    if (!email) {
      toast.error('Please enter an email address')
      return
    }

    setIsSharing(true)
    try {
      // TODO: Implement actual sharing logic
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success(`Invitation sent to ${email}`)
      setEmail('')
      onOpenChange(false)
    } catch (error) {
      toast.error('Failed to send invitation')
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Document</DialogTitle>
          <DialogDescription>
            Invite team members to collaborate on this document
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Copy Link */}
          <div className="space-y-2">
            <Label>Share Link</Label>
            <div className="flex items-center gap-2">
              <Input
                value={shareLink}
                readOnly
                className="flex-1"
              />
              <Button
                variant="outline"
                size="md"
                onClick={handleCopyLink}
              >
                {isCopied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Anyone with this link can view the document
            </p>
          </div>

          {/* Email Invite */}
          <div className="space-y-2">
            <Label htmlFor="email">Invite by Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Permission</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="view">Can view</SelectItem>
                <SelectItem value="edit">Can edit</SelectItem>
                <SelectItem value="admin">Can manage</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            className="w-full"
            onClick={handleInvite}
            disabled={isSharing || !email}
          >
            <Share2 className="h-4 w-4 mr-2" />
            {isSharing ? 'Sending...' : 'Send Invitation'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}