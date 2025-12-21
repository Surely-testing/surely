// ============================================
// FILE: app/api/test-cases/route.ts
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
      .from('test_cases')
      .select('*')
      .eq('suite_id', suiteId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    logger.log('GET test cases error:', error)
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

    // Check if it's bulk creation (multiple test cases)
    if (body.testCases && Array.isArray(body.testCases)) {
      logger.log(`Creating ${body.testCases.length} test cases`)

      const testCasesToInsert = body.testCases.map((tc: any) => ({
        suite_id: body.suiteId,
        title: tc.title,
        description: tc.description || '',
        priority: tc.priority || 'medium',
        status: 'active',
        steps: tc.steps || [],
        expected_result: tc.expectedResult || tc.expected_result || '',
        created_by: user.id
        // NOTE: Removed test_data, preconditions, type, automation_potential 
        // as they don't exist in your schema
      }))

      const { data, error } = await supabase
        .from('test_cases')
        .insert(testCasesToInsert)
        .select()

      if (error) {
        logger.log('Bulk insert error:', error)
        throw error
      }

      logger.log(`✅ Created ${data.length} test cases`)

      return NextResponse.json({ 
        success: true, 
        data, 
        count: data.length,
        message: `${data.length} test case${data.length > 1 ? 's' : ''} created successfully`
      })

    } else {
      // Single test case creation
      logger.log('Creating single test case')

      const { data: testCase, error } = await supabase
        .from('test_cases')
        .insert({
          suite_id: body.suiteId,
          title: body.title,
          description: body.description || '',
          priority: body.priority || 'medium',
          status: 'active',
          steps: body.steps || [],
          expected_result: body.expectedResult || body.expected_result || '',
          created_by: user.id
        })
        .select()
        .single()

      if (error) {
        logger.log('Single insert error:', error)
        throw error
      }

      logger.log('✅ Created test case:', testCase.id)

      return NextResponse.json({ 
        success: true, 
        data: testCase,
        message: 'Test case created successfully'
      })
    }

  } catch (error: any) {
    logger.log('❌ Create test case error:', error)
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
        error: 'Test case ID is required' 
      }, { status: 400 })
    }

    const dbUpdates: Record<string, any> = {}
    if (updates.title !== undefined) dbUpdates.title = updates.title
    if (updates.description !== undefined) dbUpdates.description = updates.description
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority
    if (updates.status !== undefined) dbUpdates.status = updates.status
    if (updates.steps !== undefined) dbUpdates.steps = updates.steps
    if (updates.expectedResult !== undefined) dbUpdates.expected_result = updates.expectedResult
    if (updates.expected_result !== undefined) dbUpdates.expected_result = updates.expected_result

    const { data: testCase, error } = await supabase
      .from('test_cases')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data: testCase })

  } catch (error: any) {
    logger.log('Update test case error:', error)
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
        error: 'Test case ID is required' 
      }, { status: 400 })
    }

    const { error } = await supabase
      .from('test_cases')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ 
      success: true, 
      message: 'Test case deleted successfully' 
    })

  } catch (error: any) {
    logger.log('Delete test case error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}