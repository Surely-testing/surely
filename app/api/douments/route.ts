// ============================================
// FILE: app/api/documents/route.ts (FIXED TO MATCH SCHEMA)
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)
    const suiteId = searchParams.get('suiteId')

    if (!suiteId) {
      return NextResponse.json({ error: 'suiteId required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('documents')
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

    // Validate required fields
    if (!body.suiteId) {
      return NextResponse.json({ 
        error: 'suiteId is required' 
      }, { status: 400 })
    }

    // Build insert object matching ONLY the actual schema columns
    const insertData: any = {
      suite_id: body.suiteId,
      title: body.title || body.name || 'Untitled Document',
      created_by: user.id
    }

    // Add optional fields only if they exist in schema
    if (body.content !== undefined) {
      insertData.content = body.content
    }
    if (body.file_url !== undefined) {
      insertData.file_url = body.file_url
    }
    if (body.file_type !== undefined) {
      insertData.file_type = body.file_type
    }
    if (body.sprint_id !== undefined) {
      insertData.sprint_id = body.sprint_id
    }

    const { data: document, error } = await supabase
      .from('documents')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      logger.log('Database error:', error)
      throw error
    }

    return NextResponse.json({ success: true, data: document })
  } catch (error: any) {
    logger.log('Create document error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      details: error.details || error.hint 
    }, { status: 500 })
  }
}