
// ============================================
// FILE: app/api/ai/automation-analysis/route.ts
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { aiService } from '@/lib/ai/ai-service'

export async function POST(req: NextRequest) {
  try {
    const { suiteId, message, framework } = await req.json()

    if (!suiteId) {
      return NextResponse.json(
        { success: false, error: 'Suite ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Fetch test cases
    const { data: testCases, error } = await supabase
      .from('test_cases')
      .select('*')
      .eq('suite_id', suiteId)

    if (error) throw error

    if (!testCases || testCases.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No test cases found to analyze'
      }, { status: 400 })
    }

    // Call AI service
    const result = await aiService.analyzeAutomation({
      testCases,
      suiteId,
      framework: framework || 'Playwright'
    })

    if (!result.success) {
      return NextResponse.json(result, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        analysis: result.data?.automationAnalysis || null,
        tokensUsed: result.data?.tokensUsed,
        cost: result.data?.cost
      }
    })

  } catch (error: any) {
    console.error('Automation analysis error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}