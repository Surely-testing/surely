// ============================================
// lib/actions/test-cases.ts
// ============================================
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { TestCaseFormData } from '@/types/test-case.types';
import type { Json } from '@/types/database.types';

export async function createTestCase(suiteId: string, data: TestCaseFormData) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: 'Unauthorized' };
    }

    const { data: testCase, error } = await supabase
        .from('test_cases')
        .insert({
            suite_id: suiteId,
            created_by: user.id,
            title: data.title,
            description: data.description,
            steps: (data.steps || []) as unknown as Json,
            expected_result: data.expected_result,
            priority: data.priority || 'medium',
            sprint_id: data.sprint_id,
        })
        .select()
        .single();

    if (error) {
        return { error: error.message };
    }

    revalidatePath(`/[suiteId]/test-cases`);
    return { data: testCase };
}

export async function updateTestCase(testCaseId: string, data: Partial<TestCaseFormData>) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: 'Unauthorized' };
    }

    // Prepare the update payload with proper type casting
    const updatePayload: {
        title?: string;
        description?: string | null;
        steps?: Json;
        expected_result?: string | null;
        priority?: string | null;
        sprint_id?: string | null;
    } = {};

    if (data.title !== undefined) updatePayload.title = data.title;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.steps !== undefined) updatePayload.steps = data.steps as unknown as Json;
    if (data.expected_result !== undefined) updatePayload.expected_result = data.expected_result;
    if (data.priority !== undefined) updatePayload.priority = data.priority;
    if (data.sprint_id !== undefined) updatePayload.sprint_id = data.sprint_id;

    const { data: testCase, error } = await supabase
        .from('test_cases')
        .update(updatePayload)
        .select()
        .single();

    if (error) {
        return { error: error.message };
    }

    revalidatePath(`/[suiteId]/test-cases`);
    revalidatePath(`/[suiteId]/test-cases/[caseId]`);
    return { data: testCase };
}

export async function deleteTestCase(testCaseId: string) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: 'Unauthorized' };
    }

    const { error } = await supabase
        .from('test_cases')
        .delete()
        .eq('id', testCaseId);

    if (error) {
        return { error: error.message };
    }

    revalidatePath(`/[suiteId]/test-cases`);
    return { success: true };
}

export async function archiveTestCase(testCaseId: string) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: 'Unauthorized' };
    }

    const { error } = await supabase
        .from('test_cases')
        .update({ status: 'archived' })
        .eq('id', testCaseId);

    if (error) {
        return { error: error.message };
    }

    revalidatePath(`/[suiteId]/test-cases`);
    return { success: true };
}