// ============================================
// FILE: app/api/ai/grammar-check/route.ts
// API route for grammar checking
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { aiService } from '@/lib/ai/ai-service'

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text || text.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: 'Text must be at least 10 characters' },
        { status: 400 }
      )
    }

    const result = await aiService.checkGrammar(text, { style: 'professional' })

    if (result.success) {
      return NextResponse.json(result)
    }

    return NextResponse.json(
      { success: false, error: result.error, userMessage: result.userMessage },
      { status: 500 }
    )
  } catch (error: any) {
    console.error('Grammar check error:', error)
    return NextResponse.json(
      { success: false, error: error.message, userMessage: 'Failed to check grammar' },
      { status: 500 }
    )
  }
}