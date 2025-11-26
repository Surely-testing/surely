// ============================================
// FILE: app/api/ai/chat/route.ts
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { aiService } from '@/lib/ai/ai-service'
import { createClient } from '@/lib/supabase/server'
import {
  getTestSuiteWithStats,
  getBugs,
  getTestCases,
  getSprints,
  getReports,
  getActivityLogs
} from '@/lib/supabase/queries'

export async function POST(req: NextRequest) {
  try {
    const { message, context, conversationHistory } = await req.json()

    // Create Supabase client
    const supabase = await createClient()

    // Get actual page data from Supabase
    const pageData = await fetchPageData(supabase, context)

    // Enhance context with page data
    const enhancedContext = {
      ...context,
      conversationHistory,
      pageData // Add the fetched data to context
    }

    // Get AI response using chatWithContext
    const result = await aiService.chatWithContext(message, enhancedContext)

    if (!result.success) {
      throw new Error(result.error || 'Failed to generate response')
    }

    // Generate suggestions based on data
    const suggestions = generateSmartSuggestions(pageData, context)

    return NextResponse.json({
      success: true,
      response: result.data?.content || '',
      metadata: {
        tokensUsed: result.data?.tokensUsed || 0,
        cost: result.data?.cost || 0,
        model: result.data?.model || 'gemini-2.0-flash-lite'
      },
      suggestions
    })

  } catch (error: any) {
    console.error('AI Chat Error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

async function fetchPageData(supabase: any, context: any) {
  const data: any = {
    page: context.currentPage,
    timestamp: new Date().toISOString()
  }

  try {
    // Get suite-specific data if suite is selected
    if (context.suiteId) {
      const suiteWithStats = await getTestSuiteWithStats(supabase, context.suiteId)
      
      data.suite = {
        id: suiteWithStats.id,
        name: suiteWithStats.name,
        description: suiteWithStats.description,
        stats: suiteWithStats.stats
      }

      // Get detailed data based on current page
      if (context.currentPage.includes('/bugs') || context.currentPage.includes('/dashboard')) {
        const bugs = await getBugs(supabase, context.suiteId)
        
        data.bugs = bugs.map((bug: any) => ({
          id: bug.id,
          title: bug.title,
          description: bug.description,
          severity: bug.severity,
          priority: bug.priority,
          status: bug.status,
          assignedTo: bug.assigned_to,
          createdAt: bug.created_at,
          updatedAt: bug.updated_at
        }))

        data.bugStats = {
          total: bugs.length,
          bySeverity: {
            critical: bugs.filter((b: any) => b.severity === 'critical').length,
            high: bugs.filter((b: any) => b.severity === 'high').length,
            medium: bugs.filter((b: any) => b.severity === 'medium').length,
            low: bugs.filter((b: any) => b.severity === 'low').length
          },
          byStatus: {
            open: bugs.filter((b: any) => b.status === 'open').length,
            inProgress: bugs.filter((b: any) => b.status === 'in_progress').length,
            resolved: bugs.filter((b: any) => b.status === 'resolved').length,
            closed: bugs.filter((b: any) => b.status === 'closed').length
          },
          byPriority: {
            high: bugs.filter((b: any) => b.priority === 'high').length,
            medium: bugs.filter((b: any) => b.priority === 'medium').length,
            low: bugs.filter((b: any) => b.priority === 'low').length
          }
        }

        // Get recent critical bugs
        data.criticalBugs = bugs
          .filter((b: any) => b.severity === 'critical' && b.status !== 'closed')
          .slice(0, 5)
          .map((bug: any) => ({
            id: bug.id,
            title: bug.title,
            severity: bug.severity,
            status: bug.status,
            createdAt: bug.created_at
          }))
      }

      if (context.currentPage.includes('/test-cases') || context.currentPage.includes('/dashboard')) {
        const testCases = await getTestCases(supabase, context.suiteId)
        
        data.testCases = testCases.map((tc: any) => ({
          id: tc.id,
          title: tc.title,
          status: tc.status,
          priority: tc.priority,
          type: tc.type,
          lastRun: tc.last_run_at
        }))

        data.testCaseStats = {
          total: testCases.length,
          byStatus: {
            passed: testCases.filter((tc: any) => tc.status === 'passed').length,
            failed: testCases.filter((tc: any) => tc.status === 'failed').length,
            pending: testCases.filter((tc: any) => tc.status === 'pending').length,
            skipped: testCases.filter((tc: any) => tc.status === 'skipped').length
          },
          byPriority: {
            high: testCases.filter((tc: any) => tc.priority === 'high').length,
            medium: testCases.filter((tc: any) => tc.priority === 'medium').length,
            low: testCases.filter((tc: any) => tc.priority === 'low').length
          }
        }

        // Calculate pass rate
        const totalWithStatus = testCases.filter((tc: any) => 
          ['passed', 'failed'].includes(tc.status)
        ).length
        const passed = testCases.filter((tc: any) => tc.status === 'passed').length
        data.testCaseStats.passRate = totalWithStatus > 0 
          ? Math.round((passed / totalWithStatus) * 100) 
          : 0
      }

      if (context.currentPage.includes('/sprints')) {
        const sprints = await getSprints(supabase, context.suiteId)
        
        data.sprints = sprints.map((sprint: any) => ({
          id: sprint.id,
          name: sprint.name,
          status: sprint.status,
          startDate: sprint.start_date,
          endDate: sprint.end_date,
          goal: sprint.goal
        }))

        data.sprintStats = {
          total: sprints.length,
          active: sprints.filter((s: any) => s.status === 'active').length,
          completed: sprints.filter((s: any) => s.status === 'completed').length,
          planned: sprints.filter((s: any) => s.status === 'planned').length
        }
      }

      if (context.currentPage.includes('/reports')) {
        const reports = await getReports(supabase, context.suiteId)
        
        data.reports = reports.map((report: any) => ({
          id: report.id,
          title: report.title,
          type: report.type,
          createdAt: report.created_at
        }))
      }

      // Get recent activity
      const activityLogs = await getActivityLogs(supabase, {
        suiteId: context.suiteId,
        limit: 10
      })

      data.recentActivity = activityLogs.map((log: any) => ({
        action: log.action,
        entityType: log.entity_type,
        entityId: log.entity_id,
        createdAt: log.created_at
      }))
    }

  } catch (error) {
    console.error('Error fetching page data:', error)
    data.error = 'Some data could not be loaded'
  }

  return data
}

function buildSystemPrompt(context: any, pageData: any) {
  const hasData = pageData && Object.keys(pageData).length > 2 // More than just page and timestamp

  let dataSection = ''
  if (hasData) {
    dataSection = `\n\nCURRENT PAGE DATA (REAL-TIME):\n${JSON.stringify(pageData, null, 2)}`
  }

  return `You are an AI assistant integrated into SURELY, a test management and bug tracking application.

IMPORTANT: You have direct access to the user's actual data from their Supabase database. Use this data to provide specific, actionable insights.

Current Context:
- Page: ${context.currentPage}
- Suite: ${context.suiteName || 'None selected'}
- User ID: ${context.userId}
${dataSection}

Guidelines:
1. **ALWAYS use the actual data provided above** - Don't ask users for information you already have
2. **Be specific** - Reference actual numbers, bug titles, test case names from the data
3. **Be proactive** - If you see critical bugs or issues, mention them immediately
4. **Give actionable advice** - Suggest specific next steps based on the real data
5. **Analyze patterns** - Look for trends in bug severity, test failures, etc.

Examples of GOOD responses (when data is available):
- "I can see you have 3 critical bugs in the '${context.suiteName || 'current'}' suite. The most urgent one is '[actual bug title]' which was created [timeframe]. Should I help you prioritize these?"
- "Your test suite has a ${pageData.testCaseStats?.passRate || 'X'}% pass rate. ${pageData.testCaseStats?.byStatus?.failed || 'X'} tests are currently failing. Let me analyze which areas need attention first."
- "You have ${pageData.bugStats?.byStatus?.open || 'X'} open bugs: ${pageData.bugStats?.bySeverity?.critical || 0} critical, ${pageData.bugStats?.bySeverity?.high || 0} high priority. I recommend focusing on..."

Examples of BAD responses (avoid these):
- "Can you tell me about your bugs?" (You already have the bug data!)
- "Please provide information about test cases" (You can see the test cases!)
- "What's the current status?" (The status is in the data!)

If NO data is available:
- Politely explain that the user should navigate to a specific page or select a test suite
- Suggest what data you need to provide better insights

Remember: Your goal is to be a helpful assistant that USES the data to provide value, not to ask for data you already have!`
}

function generateSmartSuggestions(pageData: any, context: any) {
  const suggestions = []

  // Critical bug warnings
  if (pageData.criticalBugs && pageData.criticalBugs.length > 0) {
    suggestions.push({
      id: 'critical-bugs-alert',
      type: 'warning',
      title: `${pageData.criticalBugs.length} Critical Bug(s) Need Attention`,
      description: `Critical issues detected: ${pageData.criticalBugs.map((b: any) => b.title).join(', ').substring(0, 60)}...`,
      priority: 'high',
      action: {
        label: 'Review Now',
        handler: () => {} // Will be handled by client
      }
    })
  }

  // High bug count warning
  if (pageData.bugStats && pageData.bugStats.byStatus.open > 10) {
    suggestions.push({
      id: 'many-open-bugs',
      type: 'insight',
      title: 'High Open Bug Count',
      description: `You have ${pageData.bugStats.byStatus.open} open bugs. Consider a bug triage session.`,
      priority: 'medium'
    })
  }

  // Low pass rate warning
  if (pageData.testCaseStats && pageData.testCaseStats.passRate < 80) {
    suggestions.push({
      id: 'low-pass-rate',
      type: 'warning',
      title: `${pageData.testCaseStats.passRate}% Test Pass Rate`,
      description: `${pageData.testCaseStats.byStatus.failed} tests are failing. Let me help analyze the issues.`,
      priority: 'high',
      action: {
        label: 'Analyze Failures',
        handler: () => {}
      }
    })
  }

  // No test cases yet
  if (pageData.testCaseStats && pageData.testCaseStats.total === 0) {
    suggestions.push({
      id: 'no-test-cases',
      type: 'action',
      title: 'Get Started with Test Cases',
      description: 'I can help you generate your first test cases. Just describe what you want to test!',
      priority: 'high',
      action: {
        label: 'Generate Tests',
        handler: () => {}
      }
    })
  }

  // Active sprint reminder
  if (pageData.sprintStats && pageData.sprintStats.active > 0) {
    suggestions.push({
      id: 'active-sprint',
      type: 'tip',
      title: 'Active Sprint in Progress',
      description: `You have ${pageData.sprintStats.active} active sprint(s). I can help track progress and blockers.`,
      priority: 'medium'
    })
  }

  return suggestions
}