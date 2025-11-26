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

// ... rest of the code remains the same, but update revalidatePath calls:

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

  revalidatePath('/dashboard/test-data') // CORRECTED PATH
  return { success: true, data: data as TestDataType }
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

  revalidatePath('/dashboard/test-data') // CORRECTED PATH
  return { success: true, data: data as TestDataType }
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

  revalidatePath('/dashboard/test-data') // CORRECTED PATH
  return { success: true }
}

// ... rest remains the same with corrected paths

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

  revalidatePath('/dashboard/test-data') // CORRECTED PATH
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

  revalidatePath('/dashboard/test-data') // CORRECTED PATH
  return { success: true }
}

// Export function remains the same
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