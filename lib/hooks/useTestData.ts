// lib/hooks/useTestData.ts
'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import {
  createTestDataType,
  updateTestDataType,
  deleteTestDataTypes,
  createTestDataItems,
  deleteTestDataItems,
  exportTestData
} from '@/lib/actions/test-data-actions'
import type {
  CreateTestDataTypeInput,
  UpdateTestDataTypeInput,
  CreateTestDataItemInput
} from '@/types/test-data'

// ============================================
// TEST DATA TYPES HOOKS
// ============================================
export function useTestDataTypes(suiteId: string) {
  return useQuery({
    queryKey: ['test-data-types', suiteId],
    queryFn: async () => {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('test_data_types')
        .select('*')
        .eq('suite_id', suiteId)
      
      if (error) throw new Error(error.message)
      return data
    },
    enabled: !!suiteId
  })
}

export function useCreateTestDataType(suiteId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateTestDataTypeInput) => createTestDataType(input),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['test-data-types', suiteId] })
        toast.success('Test data type created successfully')
      } else {
        toast.error(result.error || 'Failed to create test data type')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create test data type')
    }
  })
}

export function useUpdateTestDataType(suiteId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTestDataTypeInput }) =>
      updateTestDataType(id, input),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['test-data-types', suiteId] })
        toast.success('Test data type updated successfully')
      } else {
        toast.error(result.error || 'Failed to update test data type')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update test data type')
    }
  })
}

export function useDeleteTestDataTypes(suiteId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (ids: string[]) => deleteTestDataTypes(ids),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['test-data-types', suiteId] })
        toast.success('Test data types deleted successfully')
      } else {
        toast.error(result.error || 'Failed to delete test data types')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete test data types')
    }
  })
}

export function useTestDataItems(typeId: string | null) {
  return useQuery({
    queryKey: ['test-data-items', typeId],
    queryFn: async () => {
      if (!typeId) return []
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('test_data_items')
        .select('*')
        .eq('type_id', typeId)
      
      if (error) throw new Error(error.message)
      return data
    },
    enabled: !!typeId
  })
}

export function useCreateTestDataItems(typeId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (items: CreateTestDataItemInput[]) => createTestDataItems(items),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['test-data-items', typeId] })
        toast.success(`${result.data?.length || 0} items generated successfully`)
      } else {
        toast.error(result.error || 'Failed to create test data items')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create test data items')
    }
  })
}

export function useDeleteTestDataItems(typeId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (ids: string[]) => deleteTestDataItems(ids),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['test-data-items', typeId] })
        toast.success('Test data items deleted successfully')
      } else {
        toast.error(result.error || 'Failed to delete test data items')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete test data items')
    }
  })
}

export function useExportTestData() {
  return useMutation({
    mutationFn: (typeId: string) => exportTestData(typeId),
    onSuccess: (result) => {
      if (result.success && result.data) {
        const blob = new Blob([result.data.csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = result.data.fileName
        a.click()
        URL.revokeObjectURL(url)
        toast.success('Data exported successfully')
      } else {
        toast.error(result.error || 'Failed to export data')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to export data')
    }
  })
}