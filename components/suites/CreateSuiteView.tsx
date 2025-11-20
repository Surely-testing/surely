// ============================================
// FILE: components/suites/CreateSuiteView.tsx
// ============================================
'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { useSupabase } from '@/providers/SupabaseProvider'

export function CreateSuiteView() {
  const router = useRouter()
  const { supabase, user } = useSupabase()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    ownerType: 'individual',
    organizationId: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)
    setError('')

    try {
      const { data: suite, error: createError } = await supabase
        .from('test_suites')
        .insert({
          name: formData.name,
          description: formData.description || null,
          owner_type: formData.ownerType as 'individual' | 'organization',
          owner_id: formData.ownerType === 'individual' ? user.id : formData.organizationId,
          created_by: user.id,
          admins: [user.id],
          members: [user.id],
        })
        .select()
        .single()

      if (createError) throw createError

      // Redirect to new suite
      router.push(`/${suite.id}`)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to create test suite')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Button
          variant="ghost"
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          onClick={() => router.back()}
        >
          Back
        </Button>
      </div>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Create Test Suite</CardTitle>
          <CardDescription>
            Set up a new test suite for your project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-error rounded-xl">
                <p className="text-sm text-error font-medium">{error}</p>
              </div>
            )}

            <Input
              label="Suite Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Mobile App Testing, API Tests"
              required
            />

            <Textarea
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe what this test suite is for..."
              rows={4}
            />

            <Select
              label="Owner Type"
              name="ownerType"
              value={formData.ownerType}
              onChange={handleChange}
              options={[
                { value: 'individual', label: 'Personal (Individual)' },
                { value: 'organization', label: 'Organization' },
              ]}
              helperText="Personal suites are private. Organization suites can be shared with team members."
            />

            {formData.ownerType === 'organization' && (
              <Input
                label="Organization ID"
                name="organizationId"
                value={formData.organizationId}
                onChange={handleChange}
                placeholder="Select organization..."
                required
                helperText="Select which organization will own this suite"
              />
            )}

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Suite'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}