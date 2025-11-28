// ============================================
// FILE: lib/hooks/useReports.ts
// Hook for managing generated reports
// ============================================
'use client'

import { useState, useEffect, useCallback } from 'react'
import { ReportWithCreator, ReportFormData } from '@/types/report.types'
import { toast } from 'sonner'
import {
  getReports,
  createReport,
  regenerateReport,
  deleteReport,
} from '@/lib/actions/reports'

export function useReports(suiteId?: string) {
  const [reports, setReports] = useState<ReportWithCreator[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState<string | null>(null) // tracks which report is being generated/regenerated ('new' or reportId)

  const fetchReports = useCallback(async () => {
    if (!suiteId) return

    try {
      setLoading(true)
      const { data, error } = await getReports(suiteId)

      if (error) throw new Error(error)

      // Transform and validate the data
      const validReports: ReportWithCreator[] = (data || [])
        .map((report: any) => {
          // Check if creator is valid
          const hasValidCreator = report.creator && 
                                  typeof report.creator === 'object' && 
                                  'id' in report.creator &&
                                  'name' in report.creator &&
                                  'email' in report.creator

          return {
            id: report.id,
            name: report.name,
            type: report.type,
            data: report.data,
            suite_id: report.suite_id,
            sprint_id: report.sprint_id,
            created_by: report.created_by,
            created_at: report.created_at,
            updated_at: report.updated_at,
            creator: hasValidCreator ? {
              id: report.creator.id,
              name: report.creator.name,
              email: report.creator.email,
              avatar_url: report.creator.avatar_url,
            } : undefined,
          } as ReportWithCreator
        })
        .filter((report): report is ReportWithCreator => report.creator !== undefined)
      
      setReports(validReports)
    } catch (err: any) {
      console.error('Error fetching reports:', err)
      toast.error('Failed to load reports', { description: err.message })
    } finally {
      setLoading(false)
    }
  }, [suiteId])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const generateReport = async (formData: ReportFormData) => {
    try {
      setGenerating('new')
      const { data, error } = await createReport(formData, suiteId!)

      if (error) throw new Error(error)

      toast.success('Report generated successfully')
      await fetchReports()
      return data
    } catch (err: any) {
      toast.error('Failed to generate report', { description: err.message })
      throw err
    } finally {
      setGenerating(null)
    }
  }

  const regenerateReportFn = async (reportId: string) => {
    try {
      setGenerating(reportId)
      const { error } = await regenerateReport(reportId)

      if (error) throw new Error(error)

      toast.success('Report regeneration started')
      await fetchReports()
    } catch (err: any) {
      toast.error('Failed to regenerate report', { description: err.message })
    } finally {
      setGenerating(null)
    }
  }

  const deleteReportFn = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return

    try {
      const { error } = await deleteReport(reportId)

      if (error) throw new Error(error)

      toast.success('Report deleted')
      await fetchReports()
    } catch (err: any) {
      toast.error('Failed to delete report', { description: err.message })
    }
  }

  return {
    reports,
    loading,
    generating,
    fetchReports,
    generateReport,
    regenerateReport: regenerateReportFn,
    deleteReport: deleteReportFn,
  }
}

