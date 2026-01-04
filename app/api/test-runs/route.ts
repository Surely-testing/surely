// ============================================
// FILE: app/api/test-runs/route.ts
// Based on actual test_runs table schema
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)
    const suiteId = searchParams.get('suiteId')

    if (!suiteId) {
      return NextResponse.json({ 
        success: false, 
        error: 'suiteId required' 
      }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('test_runs')
      .select('*')
      .eq('suite_id', suiteId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    logger.log('GET test runs error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}

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

    if (!body.suiteId) {
      return NextResponse.json({ 
        success: false, 
        error: 'suiteId is required' 
      }, { status: 400 })
    }

    if (!body.name) {
      return NextResponse.json({ 
        success: false, 
        error: 'name is required' 
      }, { status: 400 })
    }

    if (!body.environment) {
      return NextResponse.json({ 
        success: false, 
        error: 'environment is required' 
      }, { status: 400 })
    }

    logger.log('Creating test run')

    const { data: testRun, error } = await supabase
      .from('test_runs')
      .insert({
        suite_id: body.suiteId,
        name: body.name,
        description: body.description || null,
        environment: body.environment,
        test_type: body.test_type || 'manual',
        status: body.status || 'pending',
        assigned_to: body.assigned_to || null,
        scheduled_date: body.scheduled_date || null,
        executed_at: body.executed_at || null,
        completed_at: body.completed_at || null,
        test_case_ids: body.test_case_ids || [],
        total_count: body.total_count || 0,
        passed_count: body.passed_count || 0,
        failed_count: body.failed_count || 0,
        blocked_count: body.blocked_count || 0,
        skipped_count: body.skipped_count || 0,
        notes: body.notes || null,
        attachments: body.attachments || [],
        sprint_ids: body.sprint_ids || [],
        additional_case_ids: body.additional_case_ids || [],
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      logger.log('Insert error:', error)
      throw error
    }

    logger.log('✅ Created test run:', testRun.id)

    return NextResponse.json({ 
      success: true, 
      data: testRun,
      message: 'Test run created successfully'
    })

  } catch (error: any) {
    logger.log('❌ Create test run error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      details: error.details || error.hint
    }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
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
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Test run ID is required' 
      }, { status: 400 })
    }

    // Build updates object with only provided fields
    const dbUpdates: Record<string, any> = {}
    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.description !== undefined) dbUpdates.description = updates.description
    if (updates.environment !== undefined) dbUpdates.environment = updates.environment
    if (updates.test_type !== undefined) dbUpdates.test_type = updates.test_type
    if (updates.status !== undefined) dbUpdates.status = updates.status
    if (updates.assigned_to !== undefined) dbUpdates.assigned_to = updates.assigned_to
    if (updates.scheduled_date !== undefined) dbUpdates.scheduled_date = updates.scheduled_date
    if (updates.executed_at !== undefined) dbUpdates.executed_at = updates.executed_at
    if (updates.completed_at !== undefined) dbUpdates.completed_at = updates.completed_at
    if (updates.test_case_ids !== undefined) dbUpdates.test_case_ids = updates.test_case_ids
    if (updates.total_count !== undefined) dbUpdates.total_count = updates.total_count
    if (updates.passed_count !== undefined) dbUpdates.passed_count = updates.passed_count
    if (updates.failed_count !== undefined) dbUpdates.failed_count = updates.failed_count
    if (updates.blocked_count !== undefined) dbUpdates.blocked_count = updates.blocked_count
    if (updates.skipped_count !== undefined) dbUpdates.skipped_count = updates.skipped_count
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes
    if (updates.attachments !== undefined) dbUpdates.attachments = updates.attachments
    if (updates.sprint_ids !== undefined) dbUpdates.sprint_ids = updates.sprint_ids
    if (updates.additional_case_ids !== undefined) dbUpdates.additional_case_ids = updates.additional_case_ids

    const { data: testRun, error } = await supabase
      .from('test_runs')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data: testRun })

  } catch (error: any) {
    logger.log('Update test run error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Test run ID is required' 
      }, { status: 400 })
    }

    const { error } = await supabase
      .from('test_runs')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ 
      success: true, 
      message: 'Test run deleted successfully' 
    })

  } catch (error: any) {
    logger.log('Delete test run error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}