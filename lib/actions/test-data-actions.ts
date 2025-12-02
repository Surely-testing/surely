// lib/actions/test-data-actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  TestDataType,
  TestDataItem,
  CreateTestDataTypeInput,
  UpdateTestDataTypeInput,
  CreateTestDataItemInput
} from '@/types/test-data'

// Get all test data types for a suite WITH item counts
export async function getTestDataTypes(suiteId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // Fetch types
  const { data: types, error: typesError } = await supabase
    .from('test_data_types')
    .select('*')
    .eq('suite_id', suiteId)
    .order('created_at', { ascending: false })

  if (typesError) {
    console.error('Error fetching test data types:', typesError)
    return { success: false, error: typesError.message }
  }

  // Get item counts for each type
  const typesWithCounts = await Promise.all(
    types.map(async (type) => {
      const { count } = await supabase
        .from('test_data_items')
        .select('*', { count: 'exact', head: true })
        .eq('type_id', type.id)

      return {
        ...type,
        item_count: count || 0
      }
    })
  )

  return { success: true, data: typesWithCounts as TestDataType[] }
}

// Get items for a specific type
export async function getTestDataItems(typeId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  const { data, error } = await supabase
    .from('test_data_items')
    .select('*')
    .eq('type_id', typeId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching test data items:', error)
    return { success: false, error: error.message }
  }

  return { success: true, data: data as TestDataItem[] }
}

export async function createTestDataType(input: CreateTestDataTypeInput) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  const { data, error } = await supabase
    .from('test_data_types')
    .insert({
      ...input,
      created_by: user.id
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating test data type:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/test-data')
  return { success: true, data: { ...data, item_count: 0 } as TestDataType }
}

export async function updateTestDataType(id: string, input: UpdateTestDataTypeInput) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('test_data_types')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating test data type:', error)
    return { success: false, error: error.message }
  }

  // Get item count
  const { count } = await supabase
    .from('test_data_items')
    .select('*', { count: 'exact', head: true })
    .eq('type_id', id)

  revalidatePath('/dashboard/test-data')
  return { success: true, data: { ...data, item_count: count || 0 } as TestDataType }
}

export async function deleteTestDataTypes(ids: string[]) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('test_data_types')
    .delete()
    .in('id', ids)

  if (error) {
    console.error('Error deleting test data types:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/test-data')
  return { success: true }
}

export async function createTestDataItems(items: CreateTestDataItemInput[]) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  const itemsWithUser = items.map(item => ({
    ...item,
    created_by: user.id
  }))

  const { data, error } = await supabase
    .from('test_data_items')
    .insert(itemsWithUser)
    .select()

  if (error) {
    console.error('Error creating test data items:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/test-data')
  return { success: true, data: data as TestDataItem[] }
}

export async function deleteTestDataItems(ids: string[]) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('test_data_items')
    .delete()
    .in('id', ids)

  if (error) {
    console.error('Error deleting test data items:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/test-data')
  return { success: true }
}

export async function exportTestData(typeId: string) {
  const supabase = await createClient()

  const [typeResult, itemsResult] = await Promise.all([
    supabase.from('test_data_types').select('*').eq('id', typeId).single(),
    supabase.from('test_data_items').select('*').eq('type_id', typeId)
  ])

  if (typeResult.error || itemsResult.error) {
    return { success: false, error: 'Failed to fetch data for export' }
  }

  const csv = [
    'Type,Value,Created At',
    ...itemsResult.data.map(item => 
      `"${typeResult.data.name}","${item.value.replace(/"/g, '""')}","${item.created_at}"`
    )
  ].join('\n')

  return { success: true, data: { csv, fileName: `${typeResult.data.name}-testdata.csv` } }
}