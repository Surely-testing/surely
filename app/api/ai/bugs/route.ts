// ============================================
// FILE: app/api/bugs/route.ts
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const data = await req.json()

    const { data: bug, error } = await supabase
      .from('bugs')
      .insert({
        suite_id: data.suiteId,
        title: data.title,
        description: data.description,
        severity: data.severity,
        priority: data.priority,
        status: 'open',
        steps_to_reproduce: data.steps_to_reproduce,
        expected_behavior: data.expected_behavior,
        actual_behavior: data.actual_behavior,
        environment: data.environment,
        possible_cause: data.possible_cause,
        suggested_fix: data.suggested_fix,
        created_by: data.createdBy
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data: bug })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}