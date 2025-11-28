// ============================================
// FILE: app/api/ai/chat/route.ts
// FIXED - Now properly uses context data in AI prompts
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { aiService } from '@/lib/ai/ai-service'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, context, conversationHistory } = body

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      )
    }

    console.log('📥 Chat request received:', {
      message,
      hasContext: !!context,
      hasPageData: !!(context?.pageData),
      pageDataKeys: context?.pageData ? Object.keys(context.pageData) : []
    })

    // Use the chatWithContext method which includes the enhanced system prompt
    const result = await aiService.chatWithContext(message, {
      currentPage: context?.currentPage || '/dashboard',
      suiteId: context?.suiteId,
      suiteName: context?.suiteName,
      userId: context?.userId,
      pageData: context?.pageData || {},
      conversationHistory: conversationHistory || []
    })

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'AI generation failed',
          userMessage: result.userMessage 
        },
        { status: 500 }
      )
    }

    // Check if the response contains JSON data (for bug reports, test cases, etc.)
    let parsedData: any = null
    try {
      const content = result.data?.content || ''
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0])
      }
    } catch (e) {
      // No JSON in response, that's okay
    }

    return NextResponse.json({
      success: true,
      response: result.data?.content || '',
      data: parsedData,
      metadata: {
        model: result.data?.model,
        tokensUsed: result.data?.tokensUsed,
        cost: result.data?.cost
      }
    })

  } catch (error: any) {
    console.error('❌ Chat API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error',
        userMessage: 'Something went wrong. Please try again.'
      },
      { status: 500 }
    )
  }
}