// ============================================
// FILE: lib/hooks/useReports.ts (FIXED)
// Hook for managing generated reports - Client-side queries
// ============================================
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ReportWithCreator, ReportFormData } from '@/types/report.types'
import { toast } from 'sonner'
import { logger } from '@/lib/utils/logger';

export function useReports(suiteId?: string) {
  const [reports, setReports] = useState<ReportWithCreator[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState<string | null>(null)

  const supabase = createClient()

  const fetchReports = useCallback(async () => {
    if (!suiteId) return

    try {
      setLoading(true)

      // Fetch reports for current suite
      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select('*')
        .eq('suite_id', suiteId)
        .order('created_at', { ascending: false })

      if (reportsError) throw reportsError

      if (!reportsData || reportsData.length === 0) {
        setReports([])
        return
      }

      // Fetch creator profiles separately
      const creatorIds = [...new Set(reportsData.map(r => r.created_by))]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, email, avatar_url')
        .in('id', creatorIds)

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

      // Map reports with creator info and parse data
      const validReports: ReportWithCreator[] = reportsData
        .map(report => {
          const creator = profileMap.get(report.created_by)
          if (!creator) return null

          return {
            id: report.id,
            name: report.name,
            type: report.type,
            data: typeof report.data === 'string' ? JSON.parse(report.data) : report.data,
            suite_id: report.suite_id,
            sprint_id: report.sprint_id,
            created_by: report.created_by,
            created_at: report.created_at || new Date().toISOString(),
            updated_at: report.updated_at || new Date().toISOString(),
            creator: {
              id: creator.id,
              name: creator.name,
              email: creator.email,
              avatar_url: creator.avatar_url,
            },
          } as ReportWithCreator
        })
        .filter((report): report is ReportWithCreator => report !== null)

      setReports(validReports)
    } catch (err: any) {
      logger.log('Error fetching reports:', err)
      toast.error('Failed to load reports', { description: err.message })
    } finally {
      setLoading(false)
    }
  }, [suiteId, supabase])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const generateReport = async (formData: ReportFormData) => {
    if (!suiteId) {
      toast.error('No suite selected')
      return
    }

    try {
      setGenerating('new')

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Generate simple report data
      const reportData = await generateReportData(formData, suiteId)

      const { data, error } = await supabase
        .from('reports')
        .insert({
          suite_id: suiteId,
          sprint_id: formData.filters?.sprint_id || null,
          name: formData.name,
          type: formData.type,
          data: JSON.stringify(reportData),
          created_by: user.id,
        })
        .select()
        .single()

      if (error) throw error

      toast.success('Report generated successfully')
      await fetchReports()
      return data
    } catch (err: any) {
      logger.log('Error generating report:', err)
      toast.error('Failed to generate report', { description: err.message })
      throw err
    } finally {
      setGenerating(null)
    }
  }

  const regenerateReportFn = async (reportId: string) => {
    try {
      setGenerating(reportId)

      // Get existing report
      const { data: report, error: fetchError } = await supabase
        .from('reports')
        .select('*')
        .eq('id', reportId)
        .single()

      if (fetchError || !report) throw new Error('Report not found')

      const formData: ReportFormData = {
        name: report.name,
        type: report.type as any,
        filters: {},
      }

      // Regenerate data
      const reportData = await generateReportData(formData, report.suite_id)

      const { error } = await supabase
        .from('reports')
        .update({
          data: JSON.stringify(reportData),
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId)

      if (error) throw error

      toast.success('Report regenerated successfully')
      await fetchReports()
    } catch (err: any) {
      logger.log('Error regenerating report:', err)
      toast.error('Failed to regenerate report', { description: err.message })
    } finally {
      setGenerating(null)
    }
  }

  const deleteReportFn = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return

    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId)

      if (error) throw error

      toast.success('Report deleted')
      await fetchReports()
    } catch (err: any) {
      logger.log('Error deleting report:', err)
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

// Helper function to generate report data
async function generateReportData(formData: ReportFormData, suiteId: string) {
  const supabase = createClient()
  const now = new Date()

  // FIX: Calculate 30 days AGO, not 30 days from now
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30) // Subtract 30 days

  const period = {
    start: formData.filters?.date_range?.start || thirtyDaysAgo.toISOString(),
    end: formData.filters?.date_range?.end || now.toISOString(),
  }

  console.log('Report Period:', period) // Debug log

  switch (formData.type) {
    case 'test_coverage':
      return await generateTestCoverageReport(supabase, suiteId, period)
    case 'bug_trends':
      return await generateBugTrendsReport(supabase, suiteId, period)
    case 'sprint_summary':
      return await generateSprintSummaryReport(supabase, suiteId, period)
    case 'team_performance':
      return await generateTeamPerformanceReport(supabase, suiteId, period)
    default:
      return { period, metrics: {} }
  }
}

async function generateTestCoverageReport(supabase: any, suiteId: string, period: any) {
  const { data: tests } = await supabase
    .from('test_cases')
    .select('*')
    .eq('suite_id', suiteId)
    .gte('created_at', period.start)
    .lte('created_at', period.end)

  const total = tests?.length || 0
  const passed = tests?.filter((t: any) => t.status === 'passed').length || 0
  const failed = tests?.filter((t: any) => t.status === 'failed').length || 0

  return {
    period,
    metrics: {
      totalTests: total,
      passedTests: passed,
      failedTests: failed,
      coveragePercentage: total > 0 ? Math.round((passed / total) * 100) : 0,
    },
    summary: `Generated ${total} test cases with ${passed} passing and ${failed} failing.`,
    insights: [
      total === 0 ? 'No test cases found in this period' : `${total} test cases analyzed`,
      passed > 0 ? `${Math.round((passed / total) * 100)}% pass rate` : 'No passing tests',
    ],
  }
}

// Fixed version for useReports.ts
async function generateBugTrendsReport(supabase: any, suiteId: string, period: any) {
  console.log('Fetching bugs for period:', period) // Debug log

  const { data: bugs, error } = await supabase
    .from('bugs')
    .select('*')
    .eq('suite_id', suiteId)
    .gte('created_at', period.start)
    .lte('created_at', period.end)

  if (error) {
    console.error('Error fetching bugs:', error)
  }

  console.log('Bugs found:', bugs?.length || 0) // Debug log

  const total = bugs?.length || 0
  const open = bugs?.filter((b: any) => b.status === 'open').length || 0
  const resolved = bugs?.filter((b: any) => b.status === 'resolved').length || 0

  // Count all critical bugs
  const critical = bugs?.filter((b: any) => b.severity === 'critical').length || 0

  // Count critical bugs that are NOT resolved (these need attention)
  const criticalUnresolved = bugs?.filter((b: any) =>
    b.severity === 'critical' && b.status !== 'resolved'
  ).length || 0

  // Count critical bugs that ARE resolved
  const criticalResolved = bugs?.filter((b: any) =>
    b.severity === 'critical' && b.status === 'resolved'
  ).length || 0

  return {
    period,
    metrics: {
      totalBugs: total,
      openBugs: open,
      resolvedBugs: resolved,
      criticalBugs: critical,
      criticalResolved: criticalResolved,
      criticalUnresolved: criticalUnresolved,
    },
    summary: `Tracked ${total} bugs with ${open} open, ${resolved} resolved, and ${critical} critical (${criticalResolved} resolved, ${criticalUnresolved} needing attention).`,
    insights: [
      `${total} bugs tracked in this period`,
      resolved > 0 ? `${Math.round((resolved / total) * 100)}% resolution rate` : 'No bugs resolved',
      criticalUnresolved > 0
        ? `${criticalUnresolved} critical bugs require attention${criticalResolved > 0 ? ` (${criticalResolved} critical bugs resolved)` : ''}`
        : critical > 0
          ? `All ${critical} critical bugs have been resolved`
          : 'No critical bugs',
    ],
  }
}

async function generateSprintSummaryReport(supabase: any, suiteId: string, period: any) {
  return {
    period,
    metrics: {
      sprintVelocity: 0,
      completedStories: 0,
    },
    summary: 'Sprint summary report generated.',
    insights: ['Sprint data integration coming soon'],
  }
}

async function generateTeamPerformanceReport(supabase: any, suiteId: string, period: any) {
  return {
    period,
    metrics: {
      teamMembers: 0,
      activeMembers: 0,
    },
    summary: 'Team performance report generated.',
    insights: ['Team metrics integration coming soon'],
  }
}