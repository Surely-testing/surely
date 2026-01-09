// ============================================
// 2. EnvironmentSettings.tsx - FIXED
// ============================================
'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Globe, Loader2, Save, AlertCircle } from 'lucide-react'
import { useSupabase } from '@/providers/SupabaseProvider'
import { toast } from 'sonner'
import type { Database } from '@/types/database.types'

type Environment = Database['public']['Tables']['environments']['Row']
type EnvironmentInsert = Database['public']['Tables']['environments']['Insert']
type EnvironmentUpdate = Database['public']['Tables']['environments']['Update']

interface EnvironmentSettingsProps {
  suiteId: string
}

export function EnvironmentSettings({ suiteId }: EnvironmentSettingsProps) {
  const { supabase, user } = useSupabase()
  const [environments, setEnvironments] = useState<Environment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchEnvironments()
  }, [suiteId])

  const fetchEnvironments = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('environments')
        .select('*')
        .eq('suite_id', suiteId)
        .order('type')

      if (error) throw error
      setEnvironments(data || [])
    } catch (error: any) {
      console.error('Error fetching environments:', error)
      toast.error('Failed to load environments')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddEnvironment = async () => {
    if (!user) {
      toast.error('You must be logged in')
      return
    }

    try {
      const newEnv: EnvironmentInsert = {
        suite_id: suiteId,
        name: 'New Environment',
        type: 'custom',
        base_url: 'https://example.com',
        created_by: user.id,
        is_active: true,
      }

      const { data, error } = await supabase
        .from('environments')
        .insert(newEnv)
        .select()
        .single()

      if (error) throw error
      
      setEnvironments(prev => [...prev, data])
      toast.success('Environment added')
    } catch (error: any) {
      console.error('Error adding environment:', error)
      toast.error('Failed to add environment', { description: error.message })
    }
  }

  const handleUpdateEnvironment = async (id: string, updates: Partial<Environment>) => {
    setSavingIds(prev => new Set(prev).add(id))
    
    try {
      const { error } = await supabase
        .from('environments')
        .update(updates as EnvironmentUpdate)
        .eq('id', id)

      if (error) throw error
      
      setEnvironments(prev => 
        prev.map(env => env.id === id ? { ...env, ...updates } : env)
      )
      toast.success('Environment updated')
    } catch (error: any) {
      console.error('Error updating environment:', error)
      toast.error('Failed to update environment', { description: error.message })
    } finally {
      setSavingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }

  const handleDeleteEnvironment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this environment?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('environments')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setEnvironments(prev => prev.filter(env => env.id !== id))
      toast.success('Environment deleted')
    } catch (error: any) {
      console.error('Error deleting environment:', error)
      toast.error('Failed to delete environment', { description: error.message })
    }
  }

  const handleToggleActive = async (env: Environment) => {
    await handleUpdateEnvironment(env.id, { is_active: !env.is_active })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Test Environments
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure environments where your tests will run
          </p>
        </div>
        <button
          onClick={handleAddEnvironment}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Environment
        </button>
      </div>

      {environments.length === 0 ? (
        <div className="text-center py-12 px-4 border border-dashed border-border rounded-lg">
          <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-medium text-foreground mb-1">
            No environments yet
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add your first environment to start running tests
          </p>
          <button
            onClick={handleAddEnvironment}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            Add Environment
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {environments.map((env) => {
            const isSaving = savingIds.has(env.id)
            
            return (
              <div 
                key={env.id} 
                className={`p-6 bg-card border rounded-lg space-y-4 transition-opacity ${
                  !env.is_active ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      env.is_active ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground">{env.name}</h3>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          env.type === 'production' 
                            ? 'bg-red-500/10 text-red-500'
                            : env.type === 'staging'
                            ? 'bg-yellow-500/10 text-yellow-500'
                            : env.type === 'development'
                            ? 'bg-green-500/10 text-green-500'
                            : 'bg-blue-500/10 text-blue-500'
                        }`}>
                          {env.type}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {env.description || 'No description'}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleDeleteEnvironment(env.id)}
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Delete environment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={env.name}
                      onChange={(e) => {
                        const newName = e.target.value
                        setEnvironments(prev => 
                          prev.map(item => item.id === env.id ? { ...item, name: newName } : item)
                        )
                      }}
                      onBlur={(e) => handleUpdateEnvironment(env.id, { name: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="e.g., Production"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Type
                    </label>
                    <select
                      value={env.type}
                      onChange={(e) => handleUpdateEnvironment(env.id, { type: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="development">Development</option>
                      <option value="staging">Staging</option>
                      <option value="qa">QA</option>
                      <option value="production">Production</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Base URL
                  </label>
                  <input
                    type="url"
                    value={env.base_url}
                    onChange={(e) => {
                      const newUrl = e.target.value
                      setEnvironments(prev => 
                        prev.map(item => item.id === env.id ? { ...item, base_url: newUrl } : item)
                      )
                    }}
                    onBlur={(e) => handleUpdateEnvironment(env.id, { base_url: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={env.description || ''}
                    onChange={(e) => {
                      const newDescription = e.target.value
                      setEnvironments(prev => 
                        prev.map(item => item.id === env.id ? { ...item, description: newDescription } : item)
                      )
                    }}
                    onBlur={(e) => handleUpdateEnvironment(env.id, { description: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    rows={2}
                    placeholder="Add a description for this environment"
                  />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={env.is_active}
                      onChange={() => handleToggleActive(env)}
                      className="w-4 h-4 text-primary rounded"
                    />
                    <span className="text-sm text-foreground">
                      Active (available for test runs)
                    </span>
                  </label>

                  {isSaving && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </div>
                  )}
                </div>

                {env.type === 'production' && (
                  <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-600">
                      <strong>Production Environment:</strong> Use caution when running tests here. Consider using a staging environment first.
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}