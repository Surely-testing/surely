// ============================================
// FILE: app/api/ai/report/route.ts
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { aiService } from '@/lib/ai/ai-service'
import { logger } from '@/lib/utils/logger';

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
    const { data: reportData, reportType } = body

    if (!reportData) {
      return NextResponse.json({ 
        success: false, 
        error: 'data is required' 
      }, { status: 400 })
    }

    const repType = reportType || 'qa_summary'
    logger.log(`📊 Generating ${repType} report`)

    // Generate report using AI
    const result = await aiService.generateQAReport(reportData, repType)

    if (!result.success || !result.data) {
      return NextResponse.json({ 
        success: false, 
        error: result.error || 'Failed to generate report' 
      }, { status: 500 })
    }

    // Normalize report to match YOUR schema (simple structure)
    const rawContent = result.data.content || ''
    
    const normalizedReport = {
      name: `${repType.replace('_', ' ')} Report - ${new Date().toLocaleDateString()}`,
      type: repType,
      data: {
        content: rawContent,
        generatedAt: new Date().toISOString(),
        suiteId: reportData.suiteId,
        suiteName: reportData.suiteName,
        metrics: {
          totalBugs: reportData.pageData?.bugs?.length || 0,
          totalTestCases: reportData.pageData?.testCases?.length || 0,
          passRate: reportData.pageData?.latestRunStats?.passRate || 0
        }
      },
      suiteId: reportData.suiteId
    }

    logger.log(`✅ Generated ${repType} report`)

    return NextResponse.json({ 
      success: true, 
      data: {
        report: normalizedReport,
        tokensUsed: result.data.tokensUsed || 0,
        cost: result.data.cost || 0
      },
      response: `I've generated a ${repType.replace('_', ' ')} report. Review it in the panel and save when ready.`
    })

  } catch (error: any) {
    logger.log('❌ Report generation error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal server error',
      details: error.details || error.hint
    }, { status: 500 })
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
