// ============================================
// FILE: components/settings/ProfileForm.tsx
// ============================================
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/Textarea'
import { toast } from 'sonner'
import { updateProfile } from '@/lib/actions/profile'

interface ProfileFormProps {
  profile: any
}

export default function ProfileForm({ profile }: ProfileFormProps) {
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    bio: profile?.bio || '',
    company: profile?.company || '',
    location: profile?.location || '',
    website: profile?.website || '',
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await updateProfile(formData)
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Profile details updated successfully')
      }
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Additional Information</CardTitle>
        <CardDescription>
          Add more details to your profile
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell us about yourself..."
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Brief description for your profile. Max 500 characters.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="Your company name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="City, Country"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              name="website"
              type="url"
              value={formData.website}
              onChange={handleChange}
              placeholder="https://example.com"
            />
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Details'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}