// ============================================
// FILE: app/api/ai/rewrite/route.ts
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { aiService } from '@/lib/ai/ai-service'

export async function POST(request: NextRequest) {
  try {
    const { text, style = 'professional' } = await request.json()

    if (!text || text.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: 'Text must be at least 10 characters' },
        { status: 400 }
      )
    }

    const result = await aiService.rewriteContent(text, {
      style: style as 'professional' | 'casual' | 'technical' | 'concise',
      action: 'improve',
      tone: 'neutral'
    })

    if (result.success) {
      return NextResponse.json(result)
    }

    return NextResponse.json(
      { success: false, error: result.error, userMessage: result.userMessage },
      { status: 500 }
    )
    } catch (error: any) {
    console.error('Rewrite text error:', error)
    return NextResponse.json(
      { success: false, error: error.message, userMessage: 'Failed to rewrite text' },
      { status: 500 }
    )
  }
}
  