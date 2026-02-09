// ============================================
// FILE: app/api/ai/test-cases/route.ts
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { aiService } from '@/lib/ai/ai-service'
import { logger } from '@/lib/utils/logger'

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
    const { prompt, suiteId, templateConfig } = body

    if (!prompt || !suiteId) {
      return NextResponse.json({
        success: false,
        error: 'prompt and suiteId are required'
      }, { status: 400 })
    }

    logger.log('  Generating test cases for:', prompt)

    // Generate test cases using AI
    const result = await aiService.generateTestCases(prompt, templateConfig)

    if (!result.success || !result.data) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to generate test cases'
      }, { status: 500 })
    }

    // Normalize test cases to match YOUR schema
    const rawTestCases = (result.data as any).testCases || result.data
    const testCasesArray = Array.isArray(rawTestCases) ? rawTestCases : [rawTestCases]

    const normalizedTestCases = testCasesArray.map((tc: any, index: number) => {
      // Normalize steps to ensure they're in the correct format
      let normalizedSteps = []

      if (Array.isArray(tc.steps)) {
        normalizedSteps = tc.steps.map((step: any) => {
          // If step is already an object with the right structure, keep it
          if (typeof step === 'object' && step !== null) {
            return {
              action: step.action || step.step || step.description || JSON.stringify(step),
              expected: step.expected || step.expectedResult || step.expected_result || ''
            }
          }
          // If step is a string, convert it to object format
          else if (typeof step === 'string') {
            return {
              action: step,
              expected: ''
            }
          }
          return step
        })
      }

      return {
        id: tc.id || `TC${String(index + 1).padStart(3, '0')}`,
        title: tc.title || 'Untitled Test Case',
        description: tc.description || 'No description provided',
        priority: ['high', 'medium', 'low', 'critical'].includes(tc.priority?.toLowerCase())
          ? tc.priority.toLowerCase()
          : 'medium',
        type: tc.type || 'manual',
        steps: normalizedSteps, // Use normalized steps
        expectedResult: tc.expectedResult || tc.expected_result || 'Not specified',
        preconditions: tc.preconditions || null,
        testData: tc.testData || tc.test_data || null,
        automationPotential: tc.automationPotential || tc.automation_potential || 'medium'
      }
    })

    logger.log(`✅ Generated ${normalizedTestCases.length} test cases`)
    logger.log('Sample steps structure:', normalizedTestCases[0]?.steps)

    return NextResponse.json({
      success: true,
      data: {
        testCases: normalizedTestCases,
        tokensUsed: (result as any).metadata?.tokensUsed || 0,
        cost: (result as any).metadata?.cost || 0
      },
      response: `I've generated ${normalizedTestCases.length} test case${normalizedTestCases.length > 1 ? 's' : ''}. Review them in the panel and save when ready.`
    })

  } catch (error: any) {
    logger.log('Test cases generation error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
      details: error.details || error.hint
    }, { status: 500 })
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'