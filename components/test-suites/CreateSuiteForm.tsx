// ==========================================
// FILE: components/suites/CreateSuiteForm.tsx (Enhanced Version)
// ==========================================
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createTestSuite } from '@/lib/actions/test-suites'

interface CreateSuiteFormProps {
  userId: string
}

export function CreateSuiteForm({ userId }: CreateSuiteFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    owner_type: 'individual' as 'individual' | 'organization',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!formData.name.trim()) {
      setError('Suite name is required')
      setIsLoading(false)
      return
    }

    const result = await createTestSuite({
      name: formData.name,
      description: formData.description || undefined,
      owner_type: formData.owner_type,
      owner_id: userId,
    })

    if (result.error) {
      setError(result.error)
      setIsLoading(false)
      return
    }

    if (result.suite) {
      router.push(`/${result.suite.id}`)
      router.refresh()
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
            Suite Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., E-commerce Test Suite"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            disabled={isLoading}
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="What will you be testing in this suite?"
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
            disabled={isLoading}
          />
          <p className="mt-1 text-xs text-gray-500">Optional: Add details about your test suite</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Owner Type
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className={`
              relative flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all
              ${formData.owner_type === 'individual' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
              }
              ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
            `}>
              <input
                type="radio"
                name="owner_type"
                value="individual"
                checked={formData.owner_type === 'individual'}
                onChange={() => setFormData({ ...formData, owner_type: 'individual' })}
                className="sr-only"
                disabled={isLoading}
              />
              <div className="text-center">
                <div className="text-2xl mb-2">👤</div>
                <div className="font-medium text-sm">Individual</div>
                <div className="text-xs text-gray-500 mt-1">Personal use</div>
              </div>
            </label>

            <label className={`
              relative flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all
              ${formData.owner_type === 'organization' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
              }
              ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
            `}>
              <input
                type="radio"
                name="owner_type"
                value="organization"
                checked={formData.owner_type === 'organization'}
                onChange={() => setFormData({ ...formData, owner_type: 'organization' })}
                className="sr-only"
                disabled={isLoading}
              />
              <div className="text-center">
                <div className="text-2xl mb-2">🏢</div>
                <div className="font-medium text-sm">Organization</div>
                <div className="text-xs text-gray-500 mt-1">Team collaboration</div>
              </div>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating Suite...
            </span>
          ) : (
            'Create Test Suite'
          )}
        </button>
      </form>
    </div>
  )
}