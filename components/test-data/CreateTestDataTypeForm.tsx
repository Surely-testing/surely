// components/test-data/CreateTestDataTypeForm.tsx
'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/Textarea'
import { useCreateTestDataType } from '@/lib/hooks/useTestData'
import { AVAILABLE_ICONS, AVAILABLE_COLORS } from '@/lib/constants/test-data-constants'
import { testDataGenerators } from '@/lib/utils/test-data-generators'
import { cn } from '@/lib/utils/cn'

interface CreateTestDataTypeFormProps {
  suiteId: string
  onCancel: () => void
  onSuccess: () => void
}

interface FormData {
  name: string
  description: string
  icon: string
  color: string
  generatorType: string
}

// Get available generator types from the testDataGenerators
const getAvailableGeneratorTypes = () => {
  return Object.keys(testDataGenerators).filter(key => key !== 'generic').map(key => ({
    value: key,
    label: key.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }))
}

export default function CreateTestDataTypeForm({
  suiteId,
  onCancel,
  onSuccess
}: CreateTestDataTypeFormProps) {
  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    defaultValues: {
      name: '',
      description: '',
      icon: 'Database',
      color: 'blue',
      generatorType: 'names'
    }
  })

  const createType = useCreateTestDataType(suiteId)
  const selectedGenerator = watch('generatorType')

  const onSubmit = async (data: FormData) => {
    const result = await createType.mutateAsync({
        suite_id: suiteId,
        name: data.name,
        description: data.description || undefined,
        icon: data.icon,
        color: data.color,
        generator_type: data.generatorType, // Store the generator type
        created_by: ''
    })

    if (result.success) {
      onSuccess()
    }
  }

  // Generate preview data
  const previewData = React.useMemo(() => {
    if (selectedGenerator && testDataGenerators[selectedGenerator as keyof typeof testDataGenerators]) {
      try {
        return testDataGenerators[selectedGenerator as keyof typeof testDataGenerators]()
      } catch (error) {
        return ['Preview unavailable']
      }
    }
    return ['No preview available']
  }, [selectedGenerator])

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back Button */}
      <button
        onClick={onCancel}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Test Data Types
      </button>

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">
          Create New Test Data Type
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Define a new test data type for generating test values
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              {...register('name', { required: 'Name is required' })}
              placeholder="e.g., User Emails, Test Passwords"
              className={cn(errors.name && "border-red-500")}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Brief description of this test data type..."
              rows={3}
            />
          </div>

          {/* Generator Type */}
          <div className="space-y-2">
            <Label htmlFor="generatorType">
              Data Generator <span className="text-red-500">*</span>
            </Label>
            <select
              id="generatorType"
              {...register('generatorType', { required: 'Generator type is required' })}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
            >
              {getAvailableGeneratorTypes().map(generator => (
                <option key={generator.value} value={generator.value}>
                  {generator.label}
                </option>
              ))}
            </select>
            {errors.generatorType && (
              <p className="text-sm text-red-500">{errors.generatorType.message}</p>
            )}
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              {previewData.map((item, index) => (
                <div key={index} className="text-sm font-mono text-foreground/80">
                  {item}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Sample data that will be generated using this type
            </p>
          </div>

          {/* Icon and Color */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="icon">Icon</Label>
              <select
                id="icon"
                {...register('icon')}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              >
                {AVAILABLE_ICONS.map(icon => (
                  <option key={icon} value={icon}>{icon}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <select
                id="color"
                {...register('color')}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              >
                {AVAILABLE_COLORS.map(color => (
                  <option key={color} value={color}>
                    {color.charAt(0).toUpperCase() + color.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={createType.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createType.isPending}
          >
            {createType.isPending ? 'Creating...' : 'Create Type'}
          </Button>
        </div>
      </form>
    </div>
  )
}