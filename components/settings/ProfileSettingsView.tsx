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
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* LEFT COLUMN - Avatar */}
            <div className="lg:col-span-2">
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle>Profile Picture</CardTitle>
                        <CardDescription>
                            Update your avatar
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center flex-1 space-y-4">
                        <Avatar className="h-32 w-32">
                            <AvatarImage src={profile?.avatar_url ?? undefined} />
                            <AvatarFallback className="text-3xl">
                                {name?.charAt(0)?.toUpperCase() || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="text-center">
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
                    </CardContent>
                </Card>
            </div>

            {/* RIGHT COLUMN - Profile Information */}
            <div className="lg:col-span-3">
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle>Profile Information</CardTitle>
                        <CardDescription>
                            Manage your public profile information
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Display Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter your name"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                value={profile?.email || ''}
                                disabled
                                className="bg-muted"
                            />
                            <p className="text-xs text-muted-foreground">
                                Email cannot be changed
                            </p>
                        </div>

                        <div className="flex justify-end pt-4 border-t">
                            <Button onClick={handleUpdate} disabled={isLoading} className='btn-primary'>
                                {isLoading ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}