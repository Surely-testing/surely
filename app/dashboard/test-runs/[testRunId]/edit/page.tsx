// ============================================
// FILE: app/dashboard/test-runs/[testRunId]/edit/page.tsx
// Test Run Edit Page
// ============================================
'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/providers/SupabaseProvider'
import { toast } from 'sonner'
import TestRunForm from '@/components/test-runs/TestRunsForm'

export default function TestRunEditPage({ 
  params 
}: { 
  params: Promise<{ testRunId: string }> 
}) {
  const { testRunId } = use(params)
  const router = useRouter()
  const { supabase } = useSupabase()
  const [testRun, setTestRun] = useState<any | null>(null)
  const [testCases, setTestCases] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [suiteId, setSuiteId] = useState<string>('')

  useEffect(() => {
    fetchData()
  }, [testRunId])

  const fetchData = async () => {
    try {
      setIsLoading(true)

      const { data: runData, error: runError } = await supabase
        .from('test_runs')
        .select('*')
        .eq('id', testRunId)
        .single()

      if (runError) throw runError

      setSuiteId(runData.suite_id)

      const { data: cases, error: casesError } = await supabase
        .from('test_cases')
        .select('*')
        .eq('suite_id', runData.suite_id)

      if (casesError) throw casesError

      setTestRun(runData)
      setTestCases(cases || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load test run')
      router.push('/dashboard/test-runs')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuccess = () => {
    toast.success('Test run updated successfully')
    router.push(`/dashboard/test-runs/${testRunId}`)
  }

  const handleCancel = () => {
    router.push(`/dashboard/test-runs/${testRunId}`)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    )
  }

  if (!testRun) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Test run not found</p>
          <button
            onClick={() => router.push('/dashboard/test-runs')}
            className="btn-primary px-4 py-2"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <TestRunForm
              suiteId={suiteId}
              testCases={testCases}
              initialData={testRun}
              onSuccess={handleSuccess}
              onCancel={handleCancel} sprints={[]}      />
    </div>
  )
}