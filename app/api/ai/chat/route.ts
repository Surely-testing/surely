// ============================================
// FILE: app/api/ai/chat/route.ts
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { aiService } from '@/lib/ai/ai-service'
import { logger } from '@/lib/utils/logger';
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { message, context, conversationHistory } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid message format' },
        { status: 400 }
      )
    }

    // Authenticate user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    logger.log('📨 AI Chat Request (conversation only):', {
      message: message.substring(0, 100),
      hasContext: !!context,
      page: context?.currentPage
    })

    // Build context-aware system prompt
    let systemPrompt = `You are Surely AI, an expert QA assistant for the SURELY platform.

Current Context:
- Page: ${context?.currentPage || '/dashboard'}
- Suite: ${context?.suiteName || 'Unknown Suite'}
- User ID: ${user.id}`

    // Add page data context if available
    if (context?.pageData) {
      const { bugs, bugStats, testCases, testCaseStats, latestRunStats } = context.pageData

      if (bugs && bugs.length > 0) {
        systemPrompt += `\n\nAvailable Bugs: ${bugs.length} total`
        systemPrompt += `\n- Critical: ${bugStats?.bySeverity?.critical || 0}`
        systemPrompt += `\n- High: ${bugStats?.bySeverity?.high || 0}`
        systemPrompt += `\n- Medium: ${bugStats?.bySeverity?.medium || 0}`
        systemPrompt += `\n- Low: ${bugStats?.bySeverity?.low || 0}`
      }

      if (testCases && testCases.length > 0) {
        systemPrompt += `\n\nTest Cases: ${testCases.length} total`
        systemPrompt += `\n- Passed: ${testCaseStats?.byStatus?.passed || 0}`
        systemPrompt += `\n- Failed: ${testCaseStats?.byStatus?.failed || 0}`
      }

      if (latestRunStats) {
        systemPrompt += `\n\nLatest Test Run: ${latestRunStats.passRate}% pass rate`
      }
    }

    systemPrompt += `\n\nProvide helpful, accurate responses. Be concise but thorough.`

    // Call AI service for normal conversation
    const result = await aiService.chatWithContext(message, {
      currentPage: context?.currentPage || '/dashboard',
      suiteName: context?.suiteName || 'Unknown Suite',
      userId: user.id,
      pageData: context?.pageData || {},
      conversationHistory: conversationHistory || []
    }, systemPrompt)

    if (!result.success) {
      logger.log('❌ AI Service Error:', result.error)
      return NextResponse.json(
        { 
          success: false, 
          error: result.error,
          userMessage: result.userMessage 
        },
        { status: 500 }
      )
    }

    logger.log('✅ AI chat response generated')

    return NextResponse.json({
      success: true,
      response: result.data?.content || 'I apologize, but I could not generate a response.',
      metadata: {
        model: result.data?.model,
        tokensUsed: result.data?.tokensUsed,
        cost: result.data?.cost
      }
    })

  } catch (error: any) {
    logger.log('❌ API Route Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error',
        userMessage: 'Failed to process your request. Please try again.'
      },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'