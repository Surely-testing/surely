// ============================================
// FILE: app/api/ai/bug-report/route.ts
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

    console.log('🐛 Generating bug report for:', prompt)

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

    // Extract bug report from AI response
    const rawBugReport = (result.data as any).bugReport || result.data
    
    // ✅ Normalize to match YOUR bugs table schema
    const normalizedBugReport = {
      title: rawBugReport.title || rawBugReport.name || 'AI Generated Bug Report',
      description: rawBugReport.description || rawBugReport.details || 'No description provided',
      severity: rawBugReport.severity || 'medium',
      priority: rawBugReport.priority || 'medium',
      status: rawBugReport.status || 'open',
      
      // steps_to_reproduce (JSONB array in DB)
      stepsToReproduce: Array.isArray(rawBugReport.stepsToReproduce)
        ? rawBugReport.stepsToReproduce
        : (Array.isArray(rawBugReport.steps_to_reproduce)
          ? rawBugReport.steps_to_reproduce
          : (Array.isArray(rawBugReport.steps)
            ? rawBugReport.steps
            : ['No steps provided'])),
      
      // expected_behavior (TEXT in DB)
      expectedBehavior: rawBugReport.expectedBehavior || 
                       rawBugReport.expected_behavior || 
                       rawBugReport.expectedResult ||
                       'Not specified',
      
      // actual_behavior (TEXT in DB)
      actualBehavior: rawBugReport.actualBehavior || 
                     rawBugReport.actual_behavior || 
                     rawBugReport.actualResult ||
                     'Not specified',
      
      // Environment fields - YOUR schema has separate columns
      // environment (TEXT), browser (TEXT), os (TEXT), version (TEXT)
      environment: typeof rawBugReport.environment === 'object'
        ? (rawBugReport.environment.info || JSON.stringify(rawBugReport.environment))
        : (rawBugReport.environment || null),
      
      browser: rawBugReport.environment?.browser || rawBugReport.browser || null,
      os: rawBugReport.environment?.os || rawBugReport.os || null,
      version: rawBugReport.environment?.version || rawBugReport.version || null,
      
      // Note: possible_cause and suggested_fix DON'T exist in your schema
      // But we keep them for display in the review panel
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
        tokensUsed: result.data.tokensUsed || 0,
        cost: result.data.cost || 0
      },
      response: `I've generated a bug report. Review the details and click "Save to Database" when ready.`
    })

  } catch (error: any) {
    console.error('❌ Bug report generation error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal server error',
      details: error.details || error.hint
    }, { status: 500 })
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'