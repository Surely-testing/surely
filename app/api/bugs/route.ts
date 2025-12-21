// ============================================
// FILE: app/api/bugs/route.ts (SCHEMA ALIGNED)
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
      .from('bugs')
      .select('*')
      .eq('suite_id', suiteId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    logger.log('GET bugs error:', error)
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

    // Validation for required fields
    if (!body.suiteId) {
      return NextResponse.json({ 
        success: false, 
        error: 'suiteId is required'
      }, { status: 400 })
    }

    if (!body.title || body.title.trim() === '') {
      return NextResponse.json({ 
        success: false, 
        error: 'title is required and cannot be empty'
      }, { status: 400 })
    }

    // Build insert object matching exact schema
    const insertData: {
      suite_id: string
      sprint_id?: string | null
      title: string
      description?: string | null
      severity?: string | null
      status?: string | null
      steps_to_reproduce?: any
      created_by: string
      priority?: string | null
      expected_behavior?: string | null
      actual_behavior?: string | null
      environment?: string | null
      browser?: string | null
      os?: string | null
      version?: string | null
      assigned_to?: string | null
      module?: string | null
      component?: string | null
      linked_recording_id?: string | null
      linked_test_case_id?: string | null
      tags?: string[] | null
      labels?: any
    } = {
      suite_id: body.suiteId,
      title: body.title.trim(),
      created_by: user.id
    }

    // Optional fields - only include if provided
    if (body.sprintId) insertData.sprint_id = body.sprintId
    if (body.description) insertData.description = body.description.trim()
    
    // Validate severity (must be: low, medium, high, critical)
    if (body.severity) {
      const validSeverities = ['low', 'medium', 'high', 'critical']
      if (validSeverities.includes(body.severity)) {
        insertData.severity = body.severity
      }
    }
    
    // Validate status (must be: open, in_progress, resolved, closed)
    if (body.status) {
      const validStatuses = ['open', 'in_progress', 'resolved', 'closed']
      if (validStatuses.includes(body.status)) {
        insertData.status = body.status
      }
    }
    
    // Validate priority (must be: low, medium, high, critical)
    if (body.priority) {
      const validPriorities = ['low', 'medium', 'high', 'critical']
      if (validPriorities.includes(body.priority)) {
        insertData.priority = body.priority
      }
    }
    
    if (body.expectedBehavior) insertData.expected_behavior = body.expectedBehavior
    if (body.actualBehavior) insertData.actual_behavior = body.actualBehavior
    if (body.environment) insertData.environment = body.environment
    if (body.browser) insertData.browser = body.browser
    if (body.os) insertData.os = body.os
    if (body.version) insertData.version = body.version
    if (body.assignedTo) insertData.assigned_to = body.assignedTo
    if (body.module) insertData.module = body.module
    if (body.component) insertData.component = body.component
    if (body.linkedRecordingId) insertData.linked_recording_id = body.linkedRecordingId
    if (body.linkedTestCaseId) insertData.linked_test_case_id = body.linkedTestCaseId
    if (body.tags && Array.isArray(body.tags)) insertData.tags = body.tags
    if (body.labels) insertData.labels = body.labels
    
    // Handle steps_to_reproduce - must be JSONB array
    if (body.stepsToReproduce) {
      if (Array.isArray(body.stepsToReproduce)) {
        insertData.steps_to_reproduce = body.stepsToReproduce
      } else if (typeof body.stepsToReproduce === 'string') {
        insertData.steps_to_reproduce = [body.stepsToReproduce]
      } else {
        insertData.steps_to_reproduce = []
      }
    }

    logger.log('💾 Inserting bug:', insertData)

    const { data: bug, error } = await supabase
      .from('bugs')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      logger.log('❌ Database error:', error)
      throw error
    }

    logger.log('✅ Bug created successfully:', bug)

    return NextResponse.json({ 
      success: true, 
      data: bug,
      message: 'Bug report created successfully'
    })

  } catch (error: any) {
    logger.log('❌ Create bug error:', error)
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
    if (updates.expectedBehavior !== undefined) dbUpdates.expected_behavior = updates.expectedBehavior
    if (updates.actualBehavior !== undefined) dbUpdates.actual_behavior = updates.actualBehavior
    if (updates.environment !== undefined) dbUpdates.environment = updates.environment
    if (updates.browser !== undefined) dbUpdates.browser = updates.browser
    if (updates.os !== undefined) dbUpdates.os = updates.os
    if (updates.version !== undefined) dbUpdates.version = updates.version
    if (updates.assignedTo !== undefined) dbUpdates.assigned_to = updates.assignedTo
    if (updates.module !== undefined) dbUpdates.module = updates.module
    if (updates.component !== undefined) dbUpdates.component = updates.component
    if (updates.linkedRecordingId !== undefined) dbUpdates.linked_recording_id = updates.linkedRecordingId
    if (updates.linkedTestCaseId !== undefined) dbUpdates.linked_test_case_id = updates.linkedTestCaseId
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags
    if (updates.labels !== undefined) dbUpdates.labels = updates.labels
    if (updates.sprintId !== undefined) dbUpdates.sprint_id = updates.sprintId
    if (updates.stepsToReproduce !== undefined) dbUpdates.steps_to_reproduce = updates.stepsToReproduce

    const { data: bug, error } = await supabase
      .from('bugs')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data: bug })

  } catch (error: any) {
    logger.log('Update bug error:', error)
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
    logger.log('Delete bug error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}