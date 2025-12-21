// ============================================
// FILE: app/api/ai/documentation/route.ts
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { aiService } from '@/lib/ai/ai-service'

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
    const { content, documentType } = body

    if (!content) {
      return NextResponse.json({ 
        success: false, 
        error: 'content is required' 
      }, { status: 400 })
    }

    const docType = documentType || content.type || 'general'
    console.log(`📄 Generating ${docType} documentation`)

    // Generate documentation using AI
    const result = await aiService.generateDocumentation(content, docType)

    if (!result.success || !result.data) {
      return NextResponse.json({ 
        success: false, 
        error: result.error || 'Failed to generate documentation' 
      }, { status: 500 })
    }

    // Normalize document to match YOUR schema
    const rawContent = result.data.content || ''
    
    const normalizedDocument = {
      title: `${docType === 'test_plan' ? 'Test Plan' : 'Documentation'} - ${new Date().toLocaleDateString()}`,
      content: rawContent,
      file_type: 'text/markdown',
      suiteId: content.suiteId,
      documentType: docType
    }

    console.log(`✅ Generated ${docType} documentation`)

    return NextResponse.json({ 
      success: true, 
      data: {
        document: normalizedDocument,
        tokensUsed: result.data.tokensUsed || 0,
        cost: result.data.cost || 0
      },
      response: `I've generated a ${docType === 'test_plan' ? 'test plan' : 'document'}. Review it in the panel and save when ready.`
    })

  } catch (error: any) {
    console.error('❌ Documentation generation error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal server error',
      details: error.details || error.hint
    }, { status: 500 })
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'