// ============================================
// FILE: app/api/ai/bug-report/route.ts (FIXED WITH VALIDATION)
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { aiService } from '@/lib/ai/ai-service'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    const body = await req.json()
    const { prompt, suiteId, consoleError, additionalContext } = body

    if (!prompt || !suiteId) {
      return NextResponse.json({ 
        success: false, 
        error: 'prompt and suiteId are required' 
      }, { status: 400 })
    }

    // Generate bug report using AI
    const result = await aiService.generateBugReport(
      prompt,
      consoleError,
      additionalContext
    )

    if (!result.success || !result.data) {
      return NextResponse.json({ 
        success: false, 
        error: result.error || 'Failed to generate bug report' 
      }, { status: 500 })
    }

    // ✅ CRITICAL: Validate and normalize the AI response
    // Handle both direct bugReport and nested structure
    const rawBugReport = (result.data as any).bugReport || result.data
    
    const normalizedBugReport = {
      title: rawBugReport.title || rawBugReport.name || 'AI Generated Bug Report',
      description: rawBugReport.description || rawBugReport.details || 'No description provided',
      severity: rawBugReport.severity || 'medium',
      priority: rawBugReport.priority || 'medium',
      status: rawBugReport.status || 'open',
      stepsToReproduce: Array.isArray(rawBugReport.stepsToReproduce)
        ? rawBugReport.stepsToReproduce
        : (Array.isArray(rawBugReport.steps_to_reproduce)
          ? rawBugReport.steps_to_reproduce
          : (Array.isArray(rawBugReport.steps)
            ? rawBugReport.steps
            : ['No steps provided'])),
      expectedBehavior: rawBugReport.expectedBehavior || 
                       rawBugReport.expected_behavior || 
                       rawBugReport.expectedResult ||
                       'Not specified',
      actualBehavior: rawBugReport.actualBehavior || 
                     rawBugReport.actual_behavior || 
                     rawBugReport.actualResult ||
                     'Not specified',
      environment: typeof rawBugReport.environment === 'object'
        ? rawBugReport.environment
        : (rawBugReport.environment 
          ? { info: rawBugReport.environment }
          : {}),
      possibleCause: rawBugReport.possibleCause || 
                    rawBugReport.possible_cause || 
                    rawBugReport.cause ||
                    '',
      suggestedFix: rawBugReport.suggestedFix || 
                   rawBugReport.suggested_fix || 
                   rawBugReport.fix ||
                   ''
    }

    console.log('✅ Normalized bug report:', normalizedBugReport)

    return NextResponse.json({ 
      success: true, 
      data: {
        bugReport: normalizedBugReport,
        tokensUsed: result.metadata?.tokensUsed || 0,
        cost: result.metadata?.cost || 0
      },
      response: `I've generated a bug report. Review the details and click "Save to Database" when ready.`
    })

  } catch (error: any) {
    console.error('Bug report generation error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal server error',
      details: error.details || error.hint
    }, { status: 500 })
  }
}