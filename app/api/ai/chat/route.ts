import { NextRequest, NextResponse } from 'next/server'
import { aiService } from '@/lib/ai/ai-service'
import { logger } from '@/lib/utils/logger'
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

    // FIX: Better error handling for Supabase auth
    let supabase
    let user
    
    try {
      supabase = await createClient()
      const { data, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        logger.log('Auth error:', authError.message)
        return NextResponse.json(
          { 
            success: false, 
            error: 'Authentication failed',
            userMessage: 'Please sign in again to continue' 
          },
          { status: 401 }
        )
      }
      
      if (!data || !data.user) {
        logger.log('No user found in session')
        return NextResponse.json(
          { 
            success: false, 
            error: 'User not authenticated',
            userMessage: 'Please sign in to use the AI assistant' 
          },
          { status: 401 }
        )
      }
      
      user = data.user
      logger.log('✅ User authenticated:', user.id)
      
    } catch (authErr: any) {
      logger.log('Supabase auth error:', authErr)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Authentication system error',
          userMessage: 'Unable to verify authentication. Please refresh and try again.' 
        },
        { status: 500 }
      )
    }

    // Build system prompt
    let systemPrompt = `You are Surely AI, an expert QA assistant for the SURELY platform.

Current Context:
- Page: ${context?.currentPage || '/dashboard'}
- Suite: ${context?.suiteName || 'Unknown Suite'}
- User ID: ${user.id}`

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

    // Call AI service
    logger.log('Calling AI service with context...')
    const result = await aiService.chatWithContext(message, {
      currentPage: context?.currentPage || '/dashboard',
      suiteName: context?.suiteName || 'Unknown Suite',
      userId: user.id,
      pageData: context?.pageData || {},
      conversationHistory: conversationHistory || []
    }, systemPrompt)

    if (!result.success) {
      logger.log('AI Service Error:', result.error)
      return NextResponse.json(
        { 
          success: false, 
          error: result.error,
          userMessage: result.userMessage 
        },
        { status: 500 }
      )
    }

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
    logger.log('API Route Error:', error)
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