// ============================================
// FILE: lib/actions/bulk-actions.ts
// Complete bulk actions with proper TypeScript types
// ============================================
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/utils/logger'
import type { Database } from '../../types/database.types'

// ============================================
// TYPE DEFINITIONS
// ============================================

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

type BulkActionResult = {
    success: boolean
    error?: string
    updatedCount?: number
    failedIds?: string[]
}

type AssetType =
    | 'test_cases'
    | 'bugs'
    | 'documents'
    | 'recordings'
    | 'recommendations'
    | 'sprints'
    | 'reports'
    | 'report_schedules'
    | 'test_runs'
    | 'test_data_items'
    | 'trash'
    | 'archive'

type BulkUpdateOptions = {
    userId?: string
    sprintId?: string
    moduleId?: string
    bugId?: string
    severity?: Database['public']['Tables']['bugs']['Update']['severity']
}

// ============================================
// TEST CASES BULK ACTIONS
// ============================================

export async function bulkUpdateTestCases(
    action: string,
    itemIds: string[],
    suiteId: string,
    options?: BulkUpdateOptions
): Promise<BulkActionResult> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Not authenticated' }

    try {
        switch (action) {
            case 'pass':
            case 'fail':
            case 'block': {
                const status = action === 'pass' ? 'passed' : action === 'fail' ? 'failed' : 'blocked'
                const updateData: Database['public']['Tables']['test_cases']['Update'] = {
                    status,
                    last_executed_at: new Date().toISOString(),
                    last_executed_by: user.id
                }

                const { error } = await supabase
                    .from('test_cases')
                    .update(updateData)
                    .in('id', itemIds)
                    .eq('suite_id', suiteId)

                if (error) throw error
                await logBulkActivity(supabase, user.id, 'test_case_status_updated', 'test_case', itemIds, { status })
                break
            }

            case 'run': {
                const updateData: Database['public']['Tables']['test_cases']['Update'] = {
                    status: 'running',
                    last_executed_at: new Date().toISOString(),
                    last_executed_by: user.id
                }

                const { error } = await supabase
                    .from('test_cases')
                    .update(updateData)
                    .in('id', itemIds)
                    .eq('suite_id', suiteId)

                if (error) throw error
                await logBulkActivity(supabase, user.id, 'test_case_executed', 'test_case', itemIds)
                break
            }

            case 'reset': {
                const updateData: Database['public']['Tables']['test_cases']['Update'] = {
                    status: 'draft',
                    last_executed_at: null,
                    last_executed_by: null
                }

                const { error } = await supabase
                    .from('test_cases')
                    .update(updateData)
                    .in('id', itemIds)
                    .eq('suite_id', suiteId)

                if (error) throw error
                await logBulkActivity(supabase, user.id, 'test_case_reset', 'test_case', itemIds)
                break
            }

            case 'add-to-sprint': {
                if (!options?.sprintId) throw new Error('Sprint ID required')

                const { error } = await supabase
                    .from('test_cases')
                    .update({ sprint_id: options.sprintId })
                    .in('id', itemIds)
                    .eq('suite_id', suiteId)

                if (error) throw error
                await logBulkActivity(supabase, user.id, 'test_case_sprint_assigned', 'test_case', itemIds, { sprint_id: options.sprintId })
                break
            }

            case 'add-to-module': {
                if (!options?.moduleId) throw new Error('Module ID required')

                const { error } = await supabase
                    .from('test_cases')
                    .update({ module: options.moduleId })
                    .in('id', itemIds)
                    .eq('suite_id', suiteId)

                if (error) throw error
                await logBulkActivity(supabase, user.id, 'test_case_module_assigned', 'test_case', itemIds, { module_id: options.moduleId })
                break
            }

            case 'assign': {
                if (!options?.userId) throw new Error('User ID required')

                const { error } = await supabase
                    .from('test_cases')
                    .update({ assigned_to: options.userId })
                    .in('id', itemIds)
                    .eq('suite_id', suiteId)

                if (error) throw error
                await logBulkActivity(supabase, user.id, 'test_case_assigned', 'test_case', itemIds, { assigned_to: options.userId })
                break
            }

            case 'activate': {
                const { error } = await supabase
                    .from('test_cases')
                    .update({ status: 'active' })
                    .in('id', itemIds)
                    .eq('suite_id', suiteId)

                if (error) throw error
                await logBulkActivity(supabase, user.id, 'test_case_activated', 'test_case', itemIds)
                break
            }

            case 'archive': {
                await moveToArchive(supabase, user.id, suiteId, 'test_cases', itemIds)
                await logBulkActivity(supabase, user.id, 'test_case_archived', 'test_case', itemIds)
                break
            }

            case 'delete': {
                await moveToTrash(supabase, user.id, suiteId, 'test_cases', itemIds)
                await logBulkActivity(supabase, user.id, 'test_case_deleted', 'test_case', itemIds)
                break
            }

            default:
                throw new Error(`Unknown action: ${action}`)
        }

        revalidatePath('/dashboard/test-cases')
        revalidatePath(`/dashboard/suites/${suiteId}`)

        return { success: true, updatedCount: itemIds.length }
    } catch (error) {
        logger.log('Bulk test case update error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update test cases'
        }
    }
}

// ============================================
// BUGS BULK ACTIONS
// ============================================

export async function bulkUpdateBugs(
    action: string,
    itemIds: string[],
    suiteId: string,
    options?: BulkUpdateOptions
): Promise<BulkActionResult> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Not authenticated' }

    try {
        switch (action) {
            case 'open': {
                const { error } = await supabase
                    .from('bugs')
                    .update({ status: 'open' })
                    .in('id', itemIds)
                    .eq('suite_id', suiteId)

                if (error) throw error
                await logBulkActivity(supabase, user.id, 'bug_reopened', 'bug', itemIds)
                break
            }

            case 'resolve': {
                const updateData: Database['public']['Tables']['bugs']['Update'] = {
                    status: 'resolved',
                    resolved_at: new Date().toISOString()
                }

                const { error } = await supabase
                    .from('bugs')
                    .update(updateData)
                    .in('id', itemIds)
                    .eq('suite_id', suiteId)

                if (error) throw error
                await logBulkActivity(supabase, user.id, 'bug_resolved', 'bug', itemIds)
                break
            }

            case 'close': {
                const updateData: Database['public']['Tables']['bugs']['Update'] = {
                    status: 'closed',
                    closed_at: new Date().toISOString()
                }

                const { error } = await supabase
                    .from('bugs')
                    .update(updateData)
                    .in('id', itemIds)
                    .eq('suite_id', suiteId)

                if (error) throw error
                await logBulkActivity(supabase, user.id, 'bug_closed', 'bug', itemIds)
                break
            }

            case 'assign': {
                if (!options?.userId) throw new Error('User ID required')

                const { error } = await supabase
                    .from('bugs')
                    .update({ assigned_to: options.userId })
                    .in('id', itemIds)
                    .eq('suite_id', suiteId)

                if (error) throw error
                await logBulkActivity(supabase, user.id, 'bug_assigned', 'bug', itemIds, { assigned_to: options.userId })
                break
            }

            case 'severity': {
                if (!options?.severity) throw new Error('Severity required')

                const { error } = await supabase
                    .from('bugs')
                    .update({ severity: options.severity })
                    .in('id', itemIds)
                    .eq('suite_id', suiteId)

                if (error) throw error
                await logBulkActivity(supabase, user.id, 'bug_severity_updated', 'bug', itemIds, { severity: options.severity })
                break
            }

            case 'add-to-sprint': {
                if (!options?.sprintId) throw new Error('Sprint ID required')

                const { error } = await supabase
                    .from('bugs')
                    .update({ sprint_id: options.sprintId })
                    .in('id', itemIds)
                    .eq('suite_id', suiteId)

                if (error) throw error
                await logBulkActivity(supabase, user.id, 'bug_sprint_assigned', 'bug', itemIds, { sprint_id: options.sprintId })
                break
            }

            case 'archive': {
                await moveToArchive(supabase, user.id, suiteId, 'bugs', itemIds)
                await logBulkActivity(supabase, user.id, 'bug_archived', 'bug', itemIds)
                break
            }

            case 'delete': {
                await moveToTrash(supabase, user.id, suiteId, 'bugs', itemIds)
                await logBulkActivity(supabase, user.id, 'bug_deleted', 'bug', itemIds)
                break
            }

            default:
                throw new Error(`Unknown action: ${action}`)
        }

        revalidatePath('/dashboard/bugs')
        revalidatePath(`/dashboard/suites/${suiteId}`)

        return { success: true, updatedCount: itemIds.length }
    } catch (error) {
        logger.log('Bulk bug update error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update bugs'
        }
    }
}

// ============================================
// DOCUMENTS BULK ACTIONS
// ============================================

export async function bulkUpdateDocuments(
    action: string,
    itemIds: string[],
    suiteId: string,
    options?: BulkUpdateOptions
): Promise<BulkActionResult> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Not authenticated' }

    try {
        switch (action) {
            case 'share': {
                const { data: documents } = await supabase
                    .from('documents')
                    .select('id, title')
                    .in('id', itemIds)
                    .eq('suite_id', suiteId)

                if (!documents) throw new Error('Documents not found')
                await logBulkActivity(supabase, user.id, 'document_shared', 'document', itemIds)
                break
            }

            case 'duplicate': {
                const { data: documents } = await supabase
                    .from('documents')
                    .select('*')
                    .in('id', itemIds)
                    .eq('suite_id', suiteId)

                if (!documents) throw new Error('Documents not found')

                const duplicates: Database['public']['Tables']['documents']['Insert'][] = documents.map(doc => ({
                    suite_id: doc.suite_id,
                    title: `${doc.title} (Copy)`,
                    content: doc.content,
                    file_type: doc.file_type,
                    file_url: doc.file_url,
                    created_by: user.id,
                    sprint_id: doc.sprint_id,
                    visibility: doc.visibility
                }))

                const { error } = await supabase
                    .from('documents')
                    .insert(duplicates)

                if (error) throw error
                await logBulkActivity(supabase, user.id, 'document_duplicated', 'document', itemIds)
                break
            }

            case 'archive': {
                await moveToArchive(supabase, user.id, suiteId, 'documents', itemIds)
                await logBulkActivity(supabase, user.id, 'document_archived', 'document', itemIds)
                break
            }

            case 'delete': {
                await moveToTrash(supabase, user.id, suiteId, 'documents', itemIds)
                await logBulkActivity(supabase, user.id, 'document_deleted', 'document', itemIds)
                break
            }

            default:
                throw new Error(`Unknown action: ${action}`)
        }

        revalidatePath('/dashboard/documents')
        revalidatePath(`/dashboard/suites/${suiteId}`)

        return { success: true, updatedCount: itemIds.length }
    } catch (error) {
        logger.log('Bulk document update error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update documents'
        }
    }
}

// ============================================
// RECORDINGS BULK ACTIONS
// ============================================

export async function bulkUpdateRecordings(
    action: string,
    itemIds: string[],
    suiteId: string,
    options?: BulkUpdateOptions
): Promise<BulkActionResult> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Not authenticated' }

    try {
        switch (action) {
            case 'download': {
                const { data: recordings } = await supabase
                    .from('recordings')
                    .select('id, url, title')
                    .in('id', itemIds)
                    .eq('suite_id', suiteId)

                if (!recordings) throw new Error('Recordings not found')
                await logBulkActivity(supabase, user.id, 'recording_downloaded', 'recording', itemIds)

                return {
                    success: true,
                    updatedCount: recordings.length
                }
            }

            case 'share': {
                await logBulkActivity(supabase, user.id, 'recording_shared', 'recording', itemIds)
                break
            }

            case 'link-to-bug': {
                if (!options?.bugId) throw new Error('Bug ID required')

                const { data: recordings } = await supabase
                    .from('recordings')
                    .select('*')
                    .in('id', itemIds)
                    .eq('suite_id', suiteId)

                if (!recordings) throw new Error('Recordings not found')

                for (const recording of recordings) {
                    await supabase
                        .from('bugs')
                        .update({ linked_recording_id: recording.id })
                        .eq('id', options.bugId)
                }

                await logBulkActivity(supabase, user.id, 'recording_linked_to_bug', 'recording', itemIds, { bug_id: options.bugId })
                break
            }

            case 'archive': {
                await moveToArchive(supabase, user.id, suiteId, 'recordings', itemIds)
                await logBulkActivity(supabase, user.id, 'recording_archived', 'recording', itemIds)
                break
            }

            case 'delete': {
                // For recordings, also delete from storage if applicable
                const { data: recordings } = await supabase
                    .from('recordings')
                    .select('*')
                    .in('id', itemIds)
                    .eq('suite_id', suiteId)

                if (recordings) {
                    // Delete storage files
                    for (const recording of recordings) {
                        if (recording.metadata && typeof recording.metadata === 'object' && 'fileName' in recording.metadata) {
                            await supabase.storage
                                .from('recordings')
                                .remove([recording.metadata.fileName as string])
                        }
                    }
                }

                await moveToTrash(supabase, user.id, suiteId, 'recordings', itemIds)
                await logBulkActivity(supabase, user.id, 'recording_deleted', 'recording', itemIds)
                break
            }

            default:
                throw new Error(`Unknown action: ${action}`)
        }

        revalidatePath('/dashboard/recordings')
        revalidatePath(`/dashboard/suites/${suiteId}`)

        return { success: true, updatedCount: itemIds.length }
    } catch (error) {
        logger.log('Bulk recording update error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update recordings'
        }
    }
}

// ============================================
// RECOMMENDATIONS BULK ACTIONS
// ============================================

export async function bulkUpdateRecommendations(
    action: string,
    itemIds: string[],
    suiteId: string,
    options?: BulkUpdateOptions
): Promise<BulkActionResult> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Not authenticated' }

    try {
        switch (action) {
            case 'approve': {
                const updateData: Database['public']['Tables']['recommendations']['Update'] = {
                    status: 'approved'
                }

                const { error } = await supabase
                    .from('recommendations')
                    .update(updateData)
                    .in('id', itemIds)
                    .eq('suite_id', suiteId)

                if (error) throw error
                await logBulkActivity(supabase, user.id, 'recommendation_approved', 'recommendation', itemIds)
                break
            }

            case 'reject': {
                const updateData: Database['public']['Tables']['recommendations']['Update'] = {
                    status: 'rejected'
                }

                const { error } = await supabase
                    .from('recommendations')
                    .update(updateData)
                    .in('id', itemIds)
                    .eq('suite_id', suiteId)

                if (error) throw error
                await logBulkActivity(supabase, user.id, 'recommendation_rejected', 'recommendation', itemIds)
                break
            }

            case 'add-to-sprint': {
                if (!options?.sprintId) throw new Error('Sprint ID required')

                const { error } = await supabase
                    .from('recommendations')
                    .update({ sprint_id: options.sprintId })
                    .in('id', itemIds)
                    .eq('suite_id', suiteId)

                if (error) throw error
                await logBulkActivity(supabase, user.id, 'recommendation_sprint_assigned', 'recommendation', itemIds, { sprint_id: options.sprintId })
                break
            }

            case 'archive': {
                await moveToArchive(supabase, user.id, suiteId, 'recommendations', itemIds)
                await logBulkActivity(supabase, user.id, 'recommendation_archived', 'recommendation', itemIds)
                break
            }

            case 'delete': {
                await moveToTrash(supabase, user.id, suiteId, 'recommendations', itemIds)
                await logBulkActivity(supabase, user.id, 'recommendation_deleted', 'recommendation', itemIds)
                break
            }

            default:
                throw new Error(`Unknown action: ${action}`)
        }

        revalidatePath('/dashboard/recommendations')
        revalidatePath(`/dashboard/suites/${suiteId}`)

        return { success: true, updatedCount: itemIds.length }
    } catch (error) {
        logger.log('Bulk recommendation update error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update recommendations'
        }
    }
}

// ============================================
// SPRINTS BULK ACTIONS
// ============================================

export async function bulkUpdateSprints(
    action: string,
    itemIds: string[],
    suiteId: string
): Promise<BulkActionResult> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Not authenticated' }

    try {
        switch (action) {
            case 'complete': {
                const updateData: Database['public']['Tables']['sprints']['Update'] = {
                    status: 'completed'
                }

                const { error } = await supabase
                    .from('sprints')
                    .update(updateData)
                    .in('id', itemIds)
                    .eq('suite_id', suiteId)

                if (error) throw error
                await logBulkActivity(supabase, user.id, 'sprint_completed', 'sprint', itemIds)
                break
            }

            case 'archive': {
                await moveToArchive(supabase, user.id, suiteId, 'sprints', itemIds)
                await logBulkActivity(supabase, user.id, 'sprint_archived', 'sprint', itemIds)
                break
            }

            case 'delete': {
                await moveToTrash(supabase, user.id, suiteId, 'sprints', itemIds)
                await logBulkActivity(supabase, user.id, 'sprint_deleted', 'sprint', itemIds)
                break
            }

            default:
                throw new Error(`Unknown action: ${action}`)
        }

        revalidatePath('/dashboard/sprints')
        revalidatePath(`/dashboard/suites/${suiteId}`)

        return { success: true, updatedCount: itemIds.length }
    } catch (error) {
        logger.log('Bulk sprint update error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update sprints'
        }
    }
}

// ============================================
// REPORTS BULK ACTIONS
// ============================================

export async function bulkUpdateReports(
    action: string,
    itemIds: string[],
    suiteId: string
): Promise<BulkActionResult> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Not authenticated' }

    try {
        switch (action) {
            case 'regenerate': {
                for (const reportId of itemIds) {
                    const { data: report } = await supabase
                        .from('reports')
                        .select('*')
                        .eq('id', reportId)
                        .single()

                    if (report) {
                        await supabase
                            .from('reports')
                            .update({ updated_at: new Date().toISOString() })
                            .eq('id', reportId)
                    }
                }

                await logBulkActivity(supabase, user.id, 'report_regenerated', 'report', itemIds)
                break
            }

            case 'download': {
                await logBulkActivity(supabase, user.id, 'report_downloaded', 'report', itemIds)
                break
            }

            case 'share': {
                await logBulkActivity(supabase, user.id, 'report_shared', 'report', itemIds)
                break
            }

            case 'archive': {
                await moveToArchive(supabase, user.id, suiteId, 'reports', itemIds)
                await logBulkActivity(supabase, user.id, 'report_archived', 'report', itemIds)
                break
            }

            case 'delete': {
                await moveToTrash(supabase, user.id, suiteId, 'reports', itemIds)
                await logBulkActivity(supabase, user.id, 'report_deleted', 'report', itemIds)
                break
            }

            default:
                throw new Error(`Unknown action: ${action}`)
        }

        revalidatePath('/dashboard/reports')
        revalidatePath(`/dashboard/suites/${suiteId}`)

        return { success: true, updatedCount: itemIds.length }
    } catch (error) {
        logger.log('Bulk report update error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update reports'
        }
    }
}

// ============================================
// SCHEDULES BULK ACTIONS
// ============================================

export async function bulkUpdateSchedules(
    action: string,
    itemIds: string[],
    suiteId: string
): Promise<BulkActionResult> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Not authenticated' }

    try {
        switch (action) {
            case 'enable': {
                const { error } = await supabase
                    .from('report_schedules')
                    .update({ is_active: true })
                    .in('id', itemIds)
                    .eq('suite_id', suiteId)

                if (error) throw error
                await logBulkActivity(supabase, user.id, 'schedule_enabled', 'schedule', itemIds)
                break
            }

            case 'disable': {
                const { error } = await supabase
                    .from('report_schedules')
                    .update({ is_active: false })
                    .in('id', itemIds)
                    .eq('suite_id', suiteId)

                if (error) throw error
                await logBulkActivity(supabase, user.id, 'schedule_disabled', 'schedule', itemIds)
                break
            }

            case 'run-now': {
                const { error } = await supabase
                    .from('report_schedules')
                    .update({ next_run: new Date().toISOString() })
                    .in('id', itemIds)
                    .eq('suite_id', suiteId)

                if (error) throw error
                await logBulkActivity(supabase, user.id, 'schedule_run_now', 'schedule', itemIds)
                break
            }

            case 'archive': {
                await moveToArchive(supabase, user.id, suiteId, 'report_schedules', itemIds)
                await logBulkActivity(supabase, user.id, 'schedule_archived', 'schedule', itemIds)
                break
            }

            case 'delete': {
                await moveToTrash(supabase, user.id, suiteId, 'report_schedules', itemIds)
                await logBulkActivity(supabase, user.id, 'schedule_deleted', 'schedule', itemIds)
                break
            }

            default:
                throw new Error(`Unknown action: ${action}`)
        }

        revalidatePath('/dashboard/reports')
        revalidatePath(`/dashboard/suites/${suiteId}`)

        return { success: true, updatedCount: itemIds.length }
    } catch (error) {
        logger.log('Bulk schedule update error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update schedules'
        }
    }
}

// ============================================
// TRASH/ARCHIVE BULK ACTIONS
// ============================================

export async function bulkUpdateTrash(
    action: string,
    itemIds: string[],
    suiteId: string
): Promise<BulkActionResult> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Not authenticated' }

    try {
        switch (action) {
            case 'restore': {
                const { data: trashItems } = await supabase
                    .from('trash')
                    .select('*')
                    .in('id', itemIds)
                    .eq('suite_id', suiteId)

                if (!trashItems) throw new Error('Items not found in trash')

                for (const item of trashItems) {
                    const table = item.asset_type
                    const assetData = item.asset_data as Record<string, any>

                    await supabase
                        .from(table as any)
                        .insert({
                            ...assetData,
                            restored_at: new Date().toISOString()
                        })
                }

                const { error } = await supabase
                    .from('trash')
                    .delete()
                    .in('id', itemIds)

                if (error) throw error
                await logBulkActivity(supabase, user.id, 'items_restored', 'trash', itemIds)
                break
            }

            case 'permanent-delete': {
                const { error } = await supabase
                    .from('trash')
                    .delete()
                    .in('id', itemIds)
                    .eq('suite_id', suiteId)

                if (error) throw error
                await logBulkActivity(supabase, user.id, 'items_permanently_deleted', 'trash', itemIds)
                break
            }

            default:
                throw new Error(`Unknown action: ${action}`)
        }

        revalidatePath('/dashboard/trash')
        revalidatePath(`/dashboard/suites/${suiteId}`)

        return { success: true, updatedCount: itemIds.length }
    } catch (error) {
        logger.log('Bulk trash update error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update trash items'
        }
    }
}

// ============================================
// TEST RUNS BULK ACTIONS
// ============================================

export async function bulkUpdateTestRuns(
    action: string,
    itemIds: string[],
    suiteId: string
): Promise<BulkActionResult> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Not authenticated' }

    try {
        switch (action) {
            case 'execute': {
                const updateData: Database['public']['Tables']['test_runs']['Update'] = {
                    status: 'running',
                    executed_at: new Date().toISOString()
                }

                const { error } = await supabase
                    .from('test_runs')
                    .update(updateData)
                    .in('id', itemIds)
                    .eq('suite_id', suiteId)

                if (error) throw error
                await logBulkActivity(supabase, user.id, 'test_run_executed', 'test_run', itemIds)
                break
            }

            case 'abort': {
                const updateData: Database['public']['Tables']['test_runs']['Update'] = {
                    status: 'aborted'
                }

                const { error } = await supabase
                    .from('test_runs')
                    .update(updateData)
                    .in('id', itemIds)
                    .eq('suite_id', suiteId)

                if (error) throw error
                await logBulkActivity(supabase, user.id, 'test_run_aborted', 'test_run', itemIds)
                break
            }

            case 'archive': {
                await moveToArchive(supabase, user.id, suiteId, 'test_runs', itemIds)
                await logBulkActivity(supabase, user.id, 'test_run_archived', 'test_run', itemIds)
                break
            }

            case 'delete': {
                await moveToTrash(supabase, user.id, suiteId, 'test_runs', itemIds)
                await logBulkActivity(supabase, user.id, 'test_run_deleted', 'test_run', itemIds)
                break
            }

            default:
                throw new Error(`Unknown action: ${action}`)
        }

        revalidatePath('/dashboard/test-runs')
        revalidatePath(`/dashboard/suites/${suiteId}`)

        return { success: true, updatedCount: itemIds.length }
    } catch (error) {
        logger.log('Bulk test run update error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update test runs'
        }
    }
}

// ============================================
// TEST DATA BULK ACTIONS
// ============================================

export async function bulkUpdateTestData(
    action: string,
    itemIds: string[],
    suiteId: string
): Promise<BulkActionResult> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Not authenticated' }

    try {
        switch (action) {
            case 'delete': {
                const { error } = await supabase
                    .from('test_data_items')
                    .delete()
                    .in('id', itemIds)

                if (error) throw error
                await logBulkActivity(supabase, user.id, 'test_data_deleted', 'test_data', itemIds)
                break
            }

            default:
                throw new Error(`Unknown action: ${action}`)
        }

        revalidatePath('/dashboard/test-data')
        revalidatePath(`/dashboard/suites/${suiteId}`)

        return { success: true, updatedCount: itemIds.length }
    } catch (error) {
        logger.log('Bulk test data update error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update test data'
        }
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function moveToArchive(
    supabase: SupabaseClient,
    userId: string,
    suiteId: string,
    assetType: string,
    assetIds: string[]
): Promise<void> {
    try {
        // Fetch the complete asset data
        const { data: assets } = await (supabase as any)
            .from(assetType)
            .select('*')
            .in('id', assetIds) as { data: any[] | null }

        if (!assets || assets.length === 0) {
            throw new Error(`No ${assetType} found to archive`)
        }

        // Map to proper asset_type format (camelCase for consistency with schema)
        const assetTypeMap: Record<string, string> = {
            'test_cases': 'testCases',
            'bugs': 'bugs',
            'documents': 'documents',
            'recordings': 'recordings',
            'recommendations': 'recommendations',
            'sprints': 'sprints',
            'test_data_items': 'testData',
            'reports': 'reports',
            'report_schedules': 'schedules',
            'test_runs': 'testRuns'
        }

        const mappedAssetType = assetTypeMap[assetType] || assetType

        // Insert into archived_items
        const archivedItems: Database['public']['Tables']['archived_items']['Insert'][] = assets.map((asset: any) => ({
            suite_id: suiteId,
            asset_type: mappedAssetType,
            asset_id: asset.id,
            asset_data: asset, // Store complete asset data
            archived_by: userId
        }))

        const { error: insertError } = await supabase
            .from('archived_items')
            .insert(archivedItems)

        if (insertError) {
            logger.log('Error inserting into archived_items:', insertError)
            throw insertError
        }

        // Delete from original table
        const { error: deleteError } = await (supabase as any)
            .from(assetType)
            .delete()
            .in('id', assetIds)

        if (deleteError) {
            logger.log('Error deleting from original table:', deleteError)
            throw deleteError
        }
    } catch (error) {
        logger.log('Error moving to archive:', error)
        throw error
    }
}

async function moveToTrash(
    supabase: SupabaseClient,
    userId: string,
    suiteId: string,
    assetType: string,
    assetIds: string[]
): Promise<void> {
    try {
        // Fetch the complete asset data
        const { data: assets } = await (supabase as any)
            .from(assetType)
            .select('*')
            .in('id', assetIds) as { data: any[] | null }

        if (!assets || assets.length === 0) {
            throw new Error(`No ${assetType} found to delete`)
        }

        // Map to proper asset_type format (camelCase for consistency with schema)
        const assetTypeMap: Record<string, string> = {
            'test_cases': 'testCases',
            'bugs': 'bugs',
            'documents': 'documents',
            'recordings': 'recordings',
            'recommendations': 'recommendations',
            'sprints': 'sprints',
            'test_data_items': 'testData',
            'reports': 'reports',
            'report_schedules': 'schedules',
            'test_runs': 'testRuns'
        }

        const mappedAssetType = assetTypeMap[assetType] || assetType

        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 30) // 30 days retention

        // Insert into trash
        const trashItems: Database['public']['Tables']['trash']['Insert'][] = assets.map((asset: any) => ({
            suite_id: suiteId,
            asset_type: mappedAssetType,
            asset_id: asset.id,
            asset_data: asset, // Store complete asset data
            deleted_by: userId,
            expires_at: expiresAt.toISOString()
        }))

        const { error: insertError } = await supabase
            .from('trash')
            .insert(trashItems)

        if (insertError) {
            logger.log('Error inserting into trash:', insertError)
            throw insertError
        }

        // Delete from original table
        const { error: deleteError } = await (supabase as any)
            .from(assetType)
            .delete()
            .in('id', assetIds)

        if (deleteError) {
            logger.log('Error deleting from original table:', deleteError)
            throw deleteError
        }
    } catch (error) {
        logger.log('Error moving to trash:', error)
        throw error
    }
}

async function logBulkActivity(
    supabase: SupabaseClient,
    userId: string,
    action: string,
    resourceType: string,
    resourceIds: string[],
    metadata?: Record<string, any>
): Promise<void> {
    try {
        const activities: Database['public']['Tables']['activity_logs']['Insert'][] = resourceIds.map(id => ({
            user_id: userId,
            action,
            resource_type: resourceType,
            resource_id: id,
            metadata: metadata || {}
        }))

        await supabase
            .from('activity_logs')
            .insert(activities)
    } catch (error) {
        logger.log('Error logging bulk activity:', error)
    }
}

// ============================================
// MAIN BULK ACTION ROUTER
// ============================================

export async function executeBulkAction(
    assetType: AssetType,
    action: string,
    itemIds: string[],
    suiteId: string,
    options?: BulkUpdateOptions
): Promise<BulkActionResult> {
    if (!itemIds || itemIds.length === 0) {
        return { success: false, error: 'No items selected' }
    }

    switch (assetType) {
        case 'test_cases':
            return bulkUpdateTestCases(action, itemIds, suiteId, options)

        case 'bugs':
            return bulkUpdateBugs(action, itemIds, suiteId, options)

        case 'documents':
            return bulkUpdateDocuments(action, itemIds, suiteId, options)

        case 'recordings':
            return bulkUpdateRecordings(action, itemIds, suiteId, options)

        case 'recommendations':
            return bulkUpdateRecommendations(action, itemIds, suiteId, options)

        case 'sprints':
            return bulkUpdateSprints(action, itemIds, suiteId)

        case 'reports':
            return bulkUpdateReports(action, itemIds, suiteId)

        case 'report_schedules':
            return bulkUpdateSchedules(action, itemIds, suiteId)

        case 'trash':
        case 'archive':
            return bulkUpdateTrash(action, itemIds, suiteId)

        case 'test_runs':
            return bulkUpdateTestRuns(action, itemIds, suiteId)

        case 'test_data_items':
            return bulkUpdateTestData(action, itemIds, suiteId)

        default:
            return {
                success: false,
                error: `Unknown asset type: ${assetType}`
            }
    }
}