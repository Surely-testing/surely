// ============================================
// FILE: app/api/ai/testing-insights/route.ts
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { aiService } from '@/lib/ai/ai-service'
import { isTestingInsightsResponse } from '@/lib/ai/types'

export async function POST(req: NextRequest) {
  try {
    const { suiteId } = await req.json()

    if (!suiteId) {
      return NextResponse.json(
        { success: false, error: 'Suite ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Fetch all required data
    const [
      { data: testCases },
      { data: bugs },
      { data: testRuns },
      { data: suite }
    ] = await Promise.all([
      supabase.from('test_cases').select('*').eq('suite_id', suiteId),
      supabase.from('bugs').select('*').eq('suite_id', suiteId),
      supabase.from('test_runs').select('*').eq('suite_id', suiteId).order('executed_at', { ascending: false }).limit(10),
      supabase.from('test_suites').select('name').eq('id', suiteId).single()
    ])

    // Call AI service
    const result = await aiService.analyzeTestingInsights({
      testCases: testCases || [],
      bugs: bugs || [],
      testRuns: testRuns || [],
      suiteId,
      suiteName: suite?.name || 'Unknown Suite'
    })

    if (!result.success) {
      return NextResponse.json(result, { status: 500 })
    }

    // Type guard to ensure we have the right response shape
    if (!result.data || !isTestingInsightsResponse(result.data)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid response format from AI service'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        insights: result.data.testingInsights,
        tokensUsed: result.data.tokensUsed,
        cost: result.data.cost
      }
    })

  } catch (error: any) {
    console.error('Testing insights error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}