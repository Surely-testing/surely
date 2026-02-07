// ============================================
// FILE: app/api/ai/coverage-analysis/route.ts
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { aiService } from '@/lib/ai/ai-service'
import { isCoverageAnalysisResponse } from '@/lib/ai/types'

export async function POST(req: NextRequest) {
  try {
    const { suiteId, message } = await req.json()

    if (!suiteId) {
      return NextResponse.json(
        { success: false, error: 'Suite ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Fetch test cases
    const { data: testCases, error: tcError } = await supabase
      .from('test_cases')
      .select('*')
      .eq('suite_id', suiteId)

    if (tcError) throw tcError

    // Fetch bugs
    const { data: bugs, error: bugError } = await supabase
      .from('bugs')
      .select('*')
      .eq('suite_id', suiteId)

    if (bugError) throw bugError

    // Get suite name
    const { data: suite } = await supabase
      .from('test_suites')
      .select('name')
      .eq('id', suiteId)
      .single()

    // Call AI service
    const result = await aiService.analyzeCoverage({
      testCases: testCases || [],
      bugs: bugs || [],
      suiteId,
      suiteName: suite?.name || 'Unknown Suite'
    })

    if (!result.success) {
      return NextResponse.json(result, { status: 500 })
    }

    // Type guard to ensure we have the right response shape
    if (!result.data || !isCoverageAnalysisResponse(result.data)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid response format from AI service'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        analysis: result.data.coverageAnalysis,
        tokensUsed: result.data.tokensUsed,
        cost: result.data.cost
      }
    })

  } catch (error: any) {
    console.error('Coverage analysis error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}