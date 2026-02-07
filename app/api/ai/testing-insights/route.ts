
// ============================================
// FILE: app/api/ai/testing-insights/route.ts
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { aiService } from '@/lib/ai/ai-service'

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

    // Fetch all data
    const [
      { data: bugs, error: bugError },
      { data: testCases, error: tcError },
      { data: testRuns, error: trError },
      { data: suite }
    ] = await Promise.all([
      supabase.from('bugs').select('*').eq('suite_id', suiteId),
      supabase.from('test_cases').select('*').eq('suite_id', suiteId),
      supabase.from('test_runs').select('*').eq('suite_id', suiteId).order('executed_at', { ascending: false }).limit(10),
      supabase.from('test_suites').select('name').eq('id', suiteId).single()
    ])

    if (bugError) throw bugError
    if (tcError) throw tcError

    // Call AI service
    const result = await aiService.analyzeTestingInsights({
      bugs: bugs || [],
      testCases: testCases || [],
      testRuns: testRuns || [],
      suiteId,
      suiteName: suite?.name || 'Unknown Suite'
    })

    if (!result.success) {
      return NextResponse.json(result, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        insights: result.data?.testingInsights || null,
        tokensUsed: result.data?.tokensUsed,
        cost: result.data?.cost
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