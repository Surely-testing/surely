// ============================================
// FILE: app/api/reports/route.ts (FIXED TO MATCH SCHEMA)
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)
    const suiteId = searchParams.get('suiteId')

    if (!suiteId) {
      return NextResponse.json({ error: 'suiteId required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('suite_id', suiteId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    // ✅ Fixed to match actual schema: name + type + data (JSONB)
    const { data: report, error } = await supabase
      .from('reports')
      .insert({
        suite_id: body.suiteId,
        name: body.title || body.name, // Use 'name' field
        type: body.type,
        data: {
          // Store everything else in JSONB data field
          summary: body.summary,
          sections: body.sections,
          metrics: body.metrics,
          recommendations: body.recommendations
        },
        created_by: user.id
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data: report })
  } catch (error: any) {
    console.error('Create report error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
