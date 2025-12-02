// ============================================
// FILE: app/api/bugs/route.ts (PRODUCTION READY)
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
      .from('bugs')
      .select('*')
      .eq('suite_id', suiteId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('GET bugs error:', error)
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

    // ✅ Strict validation for required fields
    if (!body.suiteId) {
      return NextResponse.json({ 
        success: false, 
        error: 'suiteId is required',
        details: 'Missing required field: suiteId'
      }, { status: 400 })
    }

    if (!body.title || body.title.trim() === '') {
      return NextResponse.json({ 
        success: false, 
        error: 'title is required and cannot be empty',
        details: 'Missing required field: title'
      }, { status: 400 })
    }

    // ✅ Build insert object with validated data matching schema exactly
    const insertData: {
      suite_id: string
      title: string
      description?: string | null
      severity?: string | null
      priority?: string | null
      status?: string | null
      steps_to_reproduce?: any
      expected_behavior?: string | null
      actual_behavior?: string | null
      environment?: any
      possible_cause?: string | null
      suggested_fix?: string | null
      reported_by?: string | null
      assigned_to?: string | null
      sprint_id?: string | null
      created_by: string
    } = {
      suite_id: body.suiteId,
      title: body.title.trim(),
      description: body.description?.trim() || 'No description provided',
      severity: body.severity || 'medium',
      priority: body.priority || 'medium',
      status: body.status || 'open',
      steps_to_reproduce: Array.isArray(body.stepsToReproduce) 
        ? body.stepsToReproduce 
        : (body.stepsToReproduce ? [body.stepsToReproduce] : []),
      expected_behavior: body.expectedBehavior || 'Not specified',
      actual_behavior: body.actualBehavior || 'Not specified',
      environment: typeof body.environment === 'object' 
        ? body.environment 
        : {},
      possible_cause: body.possibleCause || null,
      suggested_fix: body.suggestedFix || null,
      reported_by: body.reportedBy || user.id,
      assigned_to: body.assignedTo || null,
      sprint_id: body.sprintId || null,
      created_by: user.id // ✅ Required field added
    }

    console.log('💾 Inserting bug:', insertData)

    const { data: bug, error } = await supabase
      .from('bugs')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('❌ Database error:', error)
      throw error
    }

    console.log('✅ Bug created successfully:', bug)

    return NextResponse.json({ 
      success: true, 
      data: bug,
      message: 'Bug report created successfully'
    })

  } catch (error: any) {
    console.error('❌ Create bug error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to create bug',
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
        error: 'Bug ID is required' 
      }, { status: 400 })
    }

    // Map camelCase to snake_case for database
    const dbUpdates: Record<string, any> = {}
    if (updates.title !== undefined) dbUpdates.title = updates.title
    if (updates.description !== undefined) dbUpdates.description = updates.description
    if (updates.severity !== undefined) dbUpdates.severity = updates.severity
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority
    if (updates.status !== undefined) dbUpdates.status = updates.status
    if (updates.stepsToReproduce !== undefined) {
      dbUpdates.steps_to_reproduce = updates.stepsToReproduce
    }
    if (updates.expectedBehavior !== undefined) {
      dbUpdates.expected_behavior = updates.expectedBehavior
    }
    if (updates.actualBehavior !== undefined) {
      dbUpdates.actual_behavior = updates.actualBehavior
    }
    if (updates.environment !== undefined) dbUpdates.environment = updates.environment
    if (updates.possibleCause !== undefined) dbUpdates.possible_cause = updates.possibleCause
    if (updates.suggestedFix !== undefined) dbUpdates.suggested_fix = updates.suggestedFix
    if (updates.assignedTo !== undefined) dbUpdates.assigned_to = updates.assignedTo

    const { data: bug, error } = await supabase
      .from('bugs')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data: bug })

  } catch (error: any) {
    console.error('Update bug error:', error)
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
        error: 'Bug ID is required' 
      }, { status: 400 })
    }

    const { error } = await supabase
      .from('bugs')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ 
      success: true, 
      message: 'Bug deleted successfully' 
    })

  } catch (error: any) {
    console.error('Delete bug error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}