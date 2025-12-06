// ============================================
// lib/utils/transformers.ts
// CREATE THIS NEW FILE
// ============================================

/**
 * Transforms null values to undefined for TypeScript compatibility
 * PostgreSQL uses null, but TypeScript optional properties use undefined
 */

/**
 * Generic transformer for any object
 * Converts all null values to undefined recursively
 */
export function transformNullToUndefined<T>(obj: any): T {
  if (obj === null) return undefined as any;
  if (Array.isArray(obj)) return obj.map(transformNullToUndefined) as any;
  if (typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        key,
        value === null ? undefined : value
      ])
    ) as T;
  }
  return obj;
}

/**
 * Transform test case data from Supabase to match TypeScript types
 */
export function transformTestCase(tc: any) {
  return {
    ...tc,
    description: tc.description ?? undefined,
    preconditions: tc.preconditions ?? undefined,
    postconditions: tc.postconditions ?? undefined,
    expected_result: tc.expected_result ?? undefined,
    assigned_to: tc.assigned_to ?? undefined,
    sprint_id: tc.sprint_id ?? undefined,
    archived_at: tc.archived_at ?? undefined,
    archived_by: tc.archived_by ?? undefined,
    last_result: tc.last_result ?? undefined,
    last_executed_at: tc.last_executed_at ?? undefined,
    last_executed_by: tc.last_executed_by ?? undefined,
    test_data_id: tc.test_data_id ?? undefined,
    parent_id: tc.parent_id ?? undefined,
    last_pass_date: tc.last_pass_date ?? undefined,
    last_fail_date: tc.last_fail_date ?? undefined,
    module: tc.module ?? undefined,
    type: tc.type ?? undefined,
  };
}

/**
 * Transform bug data from Supabase to match TypeScript types
 */
export function transformBug(bug: any) {
  return {
    ...bug,
    description: bug.description ?? undefined,
    severity: bug.severity ?? undefined,
    priority: bug.priority ?? undefined,
    expected_behavior: bug.expected_behavior ?? undefined,
    actual_behavior: bug.actual_behavior ?? undefined,
    environment: bug.environment ?? undefined,
    browser: bug.browser ?? undefined,
    os: bug.os ?? undefined,
    version: bug.version ?? undefined,
    assigned_to: bug.assigned_to ?? undefined,
    module: bug.module ?? undefined,
    component: bug.component ?? undefined,
    linked_recording_id: bug.linked_recording_id ?? undefined,
    linked_test_case_id: bug.linked_test_case_id ?? undefined,
    tags: bug.tags ?? undefined,
    labels: bug.labels ?? undefined,
    resolved_at: bug.resolved_at ?? undefined,
    closed_at: bug.closed_at ?? undefined,
    sprint_id: bug.sprint_id ?? undefined,
  };
}

/**
 * Transform suggestion data from Supabase to match TypeScript types
 */
export function transformSuggestion(suggestion: any) {
  return {
    ...suggestion,
    rationale: suggestion.rationale ?? undefined,
    effort_estimate: suggestion.effort_estimate ?? undefined,
    assigned_to: suggestion.assigned_to ?? undefined,
    tags: suggestion.tags ?? undefined,
    attachments: suggestion.attachments ?? undefined,
    discussion_notes: suggestion.discussion_notes ?? undefined,
    implemented_at: suggestion.implemented_at ?? undefined,
    sprint_id: suggestion.sprint_id ?? undefined,
  };
}

/**
 * Transform sprint data from Supabase to match TypeScript types
 */
export function transformSprint(sprint: any) {
  return {
    ...sprint,
    description: sprint.description ?? undefined,
    goals: sprint.goals ?? undefined,
    archived_at: sprint.archived_at ?? undefined,
    archived_by: sprint.archived_by ?? undefined,
  };
}