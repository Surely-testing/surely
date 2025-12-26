// ============================================
// FILE: app/api/ai/suggestions/route.ts
// API route for document suggestions
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { aiService } from '@/lib/ai/ai-service'

export async function POST(request: NextRequest) {
  try {
    const { docType, headings, contentLength, sectionCount } = await request.json()

    const result = await aiService.generateSuggestions({
      currentPage: 'document-editor',
      recentActions: ['writing', docType],
      pageData: { 
        docType, 
        headings, 
        contentLength,
        sectionCount
      },
      userRole: 'writer'
    })

    if (result.success && result.data && 'suggestions' in result.data) {
      return NextResponse.json({
        success: true,
        suggestions: result.data.suggestions
      })
    }

    return NextResponse.json(
      { 
        success: false, 
        error: result.error, 
        userMessage: result.userMessage || 'Failed to generate suggestions' 
      },
      { status: 500 }
    )
  } catch (error: any) {
    console.error('Generate suggestions error:', error)
    return NextResponse.json(
      { success: false, error: error.message, userMessage: 'Failed to generate suggestions' },
      { status: 500 }
    )
  }
}