// ============================================
// FILE: app/api/ai/test-cases/route.ts
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { aiService } from '@/lib/ai/ai-service'
import { aiLogger } from '@/lib/ai/ai-logger'
import { AIUsageLogInput, isTestCasesResponse } from '@/lib/ai/types'
import type { Database } from '@/types/database.types'

// Request body type
interface TestCasesRequestBody {
  prompt: string
  suiteId: string
  templateConfig?: {
    includeSteps?: boolean
    includePreconditions?: boolean
    includeTestData?: boolean
    includeAutomationPotential?: boolean
    testTypes?: Array<'functional' | 'integration' | 'regression' | 'performance'>
    priorityLevels?: Array<'high' | 'medium' | 'low'>
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: TestCasesRequestBody = await request.json()
    const { prompt, suiteId, templateConfig } = body

    if (!prompt || !suiteId) {
      return NextResponse.json(
        { error: 'Prompt and suiteId are required' },
        { status: 400 }
      )
    }

    // Verify access to test suite
    const { data: suite, error: suiteError } = await supabase
      .from('test_suites')
      .select('id, created_by, admins, members')
      .eq('id', suiteId)
      .single()

    if (suiteError || !suite) {
      return NextResponse.json({ error: 'Test suite not found' }, { status: 404 })
    }

    // Type assertion to handle the suite data structure
    const suiteData = suite as {
      id: string
      created_by: string
      admins: string[] | null
      members: string[] | null
    }

    const hasAccess = 
      suiteData.created_by === user.id ||
      suiteData.admins?.includes(user.id) ||
      suiteData.members?.includes(user.id)

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Generate test cases
    const result = await aiService.generateTestCases(prompt, templateConfig)

    if (!result.success || !result.data) {
      return NextResponse.json({
        success: false,
        error: result.error,
        userMessage: result.userMessage
      }, { status: 500 })
    }

    const duration = Date.now() - startTime

    // Extract test cases with proper typing using type guard
    const testCases = isTestCasesResponse(result.data) ? result.data.testCases : undefined

    // Log to Supabase
    const logData: AIUsageLogInput = {
      user_id: user.id,
      suite_id: suiteId,
      operation_type: 'test_cases',
      operation_name: 'Generate Test Cases',
      asset_type: 'testCases',
      asset_ids: testCases?.map(tc => tc.id) || [],
      provider: 'gemini',
      model: result.data.model || 'unknown',
      tokens_used: result.data.tokensUsed || 0,
      input_tokens: result.data.inputTokens ?? 0,
      output_tokens: result.data.outputTokens ?? 0,
      cost: result.data.cost ?? 0,
      cost_breakdown: result.data.costBreakdown,
      success: true,
      prompt_summary: prompt.substring(0, 200),
      prompt_length: prompt.length,
      duration_ms: duration,
      metadata: {
        testCasesCount: testCases?.length || 0,
        templateConfig
      }
    }

    aiLogger.logUsage(logData)
      .catch(err => console.error('Failed to log:', err))

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('Test Cases API Error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}