// ============================================
// FILE: components/settings/ProfileSettings.tsx
// ============================================
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { updateProfile, uploadAvatar } from '@/lib/actions/profile'
import type { Profile } from '@/types/profile'

interface ProfileSettingsProps {
    profile: Profile | null
}

export default function ProfileSettings({ profile }: ProfileSettingsProps) {
    const [name, setName] = useState(profile?.name || '')
    const [isLoading, setIsLoading] = useState(false)

    const handleUpdate = async () => {
        setIsLoading(true)
        const result = await updateProfile({ name })

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Profile updated successfully')
        }
        setIsLoading(false)
    }

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Check file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size must be less than 5MB')
            return
        }

        const result = await uploadAvatar(file)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Avatar updated successfully')
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>
                    Manage your public profile information
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                        <AvatarImage src={profile?.avatar_url ?? undefined} />
                        <AvatarFallback>
                            {name?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <Label htmlFor="avatar" className="cursor-pointer">
                            <Button variant="outline" asChild>
                                <span>Change Avatar</span>
                            </Button>
                        </Label>
                        <Input
                            id="avatar"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarUpload}
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                            JPG, PNG or GIF. Max 5MB.
                        </p>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="name">Display Name</Label>
                    <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your name"
                    />
                </div>

                <Button onClick={handleUpdate} disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
            </CardContent>
        </Card>
    )
}