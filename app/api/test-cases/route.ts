// ============================================
// FILE: app/api/test-cases/route.ts (REPLACE YOUR EXISTING FILE)
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET all test cases for a suite
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)
    const suiteId = searchParams.get('suiteId')

    if (!suiteId) {
      return NextResponse.json({ error: 'suiteId required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('test_cases')
      .select('*')
      .eq('suite_id', suiteId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// CREATE test case(s) - handles both single and bulk
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    // Check if it's bulk creation
    if (body.testCases && Array.isArray(body.testCases)) {
      // BULK CREATE
      const testCasesToInsert = body.testCases.map((tc: any) => ({
        suite_id: body.suiteId,
        title: tc.title,
        description: tc.description,
        priority: tc.priority,
        type: tc.type,
        preconditions: tc.preconditions,
        steps: tc.steps,
        expected_result: tc.expectedResult || tc.expected_result,
        test_data: tc.testData || tc.test_data,
        automation_potential: tc.automationPotential || tc.automation_potential,
        status: 'pending',
        created_by: user.id
      }))

      const { data, error } = await supabase
        .from('test_cases')
        .insert(testCasesToInsert)
        .select()

      if (error) throw error

      return NextResponse.json({ success: true, data, count: data.length })
    } else {
      // SINGLE CREATE
      const { data: testCase, error } = await supabase
        .from('test_cases')
        .insert({
          suite_id: body.suiteId,
          title: body.title,
          description: body.description,
          priority: body.priority,
          type: body.type,
          preconditions: body.preconditions,
          steps: body.steps,
          expected_result: body.expectedResult || body.expected_result,
          test_data: body.testData || body.test_data,
          automation_potential: body.automationPotential || body.automation_potential,
          status: 'pending',
          created_by: user.id
        })
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({ success: true, data: testCase })
    }
  } catch (error: any) {
    console.error('Create test case error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}