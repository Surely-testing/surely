// ============================================
// 1. RunTestsModal.tsx - FIXED
// ============================================
'use client'

import React, { useState, useEffect } from 'react'
import { Play, X, Settings, Globe, Loader2 } from 'lucide-react'
import { useSupabase } from '@/providers/SupabaseProvider'
import { toast } from 'sonner'
import type { Database } from '@/types/database.types'

type Environment = Database['public']['Tables']['environments']['Row']

interface RunTestsModalProps {
  isOpen: boolean
  onClose: () => void
  testCaseIds: string[]
  suiteId: string
  onSuccess?: () => void
}

export function RunTestsModal({ 
  isOpen, 
  onClose, 
  testCaseIds, 
  suiteId,
  onSuccess 
}: RunTestsModalProps) {
  const { supabase, user } = useSupabase()
  const [environments, setEnvironments] = useState<Environment[]>([])
  const [selectedEnv, setSelectedEnv] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingEnvs, setIsFetchingEnvs] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchEnvironments()
    }
  }, [isOpen, suiteId])

  const fetchEnvironments = async () => {
    setIsFetchingEnvs(true)
    try {
      const { data, error } = await supabase
        .from('environments')
        .select('*')
        .eq('suite_id', suiteId)
        .eq('is_active', true)
        .order('type')

      if (error) throw error
      
      setEnvironments(data || [])
      
      // Auto-select development if available
      const devEnv = data?.find(e => e.type === 'development')
      if (devEnv) {
        setSelectedEnv(devEnv.type)
      } else if (data && data.length > 0) {
        setSelectedEnv(data[0].type)
      }
    } catch (error: any) {
      console.error('Error fetching environments:', error)
      toast.error('Failed to load environments')
    } finally {
      setIsFetchingEnvs(false)
    }
  }

  const handleRunTests = async () => {
    if (!selectedEnv) {
      toast.error('Please select an environment')
      return
    }

    if (!user) {
      toast.error('You must be logged in to run tests')
      return
    }

    setIsLoading(true)
    try {
      // Create test run
      const { data: testRun, error: runError } = await supabase
        .from('test_runs')
        .insert({
          suite_id: suiteId,
          environment: selectedEnv,
          status: 'pending',
          total_count: testCaseIds.length,
          created_by: user.id,
          name: `Test Run - ${new Date().toLocaleString()}`,
          test_case_ids: testCaseIds,
        })
        .select()
        .single()

      if (runError) {
        console.error('Error creating test run:', runError)
        throw new Error(runError.message || 'Failed to create test run')
      }

      if (!testRun) {
        throw new Error('Test run was not created')
      }

      // Trigger execution via API
      const response = await fetch('/api/test-execution/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runId: testRun.id,
          testCaseIds,
          environment: selectedEnv,
          suiteId,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API request failed: ${response.status} - ${errorText}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to start test execution')
      }

      toast.success('Test execution started', {
        description: `Running ${testCaseIds.length} test case(s) in ${selectedEnv} environment`,
      })

      onSuccess?.()
      onClose()
    } catch (error: any) {
      console.error('Error running tests:', error)
      toast.error('Failed to run tests', { description: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Play className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Run Tests</h2>
              <p className="text-sm text-muted-foreground">
                {testCaseIds.length} test case(s) selected
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Environment Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <Globe className="w-4 h-4 inline mr-2" />
              Select Environment
            </label>
            
            {isFetchingEnvs ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : environments.length === 0 ? (
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  No environments configured
                </p>
                <button
                  onClick={() => {
                    onClose()
                    // Navigate to environments settings
                    window.location.href = `/dashboard/test-suites/${suiteId}/settings#environments`
                  }}
                  className="text-sm text-primary hover:underline"
                >
                  Configure environments
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {environments.map((env) => (
                  <label
                    key={env.id}
                    className={`
                      flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all
                      ${selectedEnv === env.type 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="environment"
                      value={env.type}
                      checked={selectedEnv === env.type}
                      onChange={(e) => setSelectedEnv(e.target.value)}
                      className="w-4 h-4 text-primary"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground capitalize">
                          {env.name}
                        </span>
                        <span className={`
                          px-2 py-0.5 rounded text-xs font-medium
                          ${env.type === 'production' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}
                        `}>
                          {env.type}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {env.base_url}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Tests will execute in the background. You'll be notified when complete.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleRunTests}
            disabled={isLoading || !selectedEnv || environments.length === 0}
            className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run Tests
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}