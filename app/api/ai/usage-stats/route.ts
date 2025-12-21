// ============================================
// FILE: app/api/ai/usage-stats/route.ts
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { aiLogger } from '@/lib/ai/ai-logger'
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const suiteId = searchParams.get('suiteId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!suiteId) {
      return NextResponse.json({ error: 'suiteId is required' }, { status: 400 })
    }

    // Verify access to test suite
    const { data: suite } = await supabase
      .from('test_suites')
      .select('id, created_by, admins, members')
      .eq('id', suiteId)
      .single()

    if (!suite || !(
      suite.created_by === user.id ||
      suite.admins?.includes(user.id) ||
      suite.members?.includes(user.id)
    )) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const stats = await aiLogger.getSuiteUsageStats(suiteId, {
      startDate: startDate || undefined,
      endDate: endDate || undefined
    })

    return NextResponse.json(stats)

  } catch (error: any) {
    logger.log('Usage Stats API Error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}