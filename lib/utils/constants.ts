// ============================================
// FILE: lib/utils/constants.ts
// ============================================

export const APP_NAME = 'Surely'
export const APP_DESCRIPTION = 'AI-Powered Quality Assurance Platform'

// Test Case Priorities
export const TEST_CASE_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const
export type TestCasePriority = typeof TEST_CASE_PRIORITIES[number]

// Test Case Statuses
export const TEST_CASE_STATUSES = ['active', 'archived', 'deleted'] as const
export type TestCaseStatus = typeof TEST_CASE_STATUSES[number]

// Bug Severities
export const BUG_SEVERITIES = ['low', 'medium', 'high', 'critical'] as const
export type BugSeverity = typeof BUG_SEVERITIES[number]

// Bug Statuses
export const BUG_STATUSES = ['open', 'in_progress', 'resolved', 'closed'] as const
export type BugStatus = typeof BUG_STATUSES[number]

// Sprint Statuses
export const SPRINT_STATUSES = ['planning', 'active', 'completed', 'archived'] as const
export type SprintStatus = typeof SPRINT_STATUSES[number]

// Organization Roles
export const ORG_ROLES = ['owner', 'admin', 'manager', 'member'] as const
export type OrgRole = typeof ORG_ROLES[number]

// Subscription Statuses
export const SUBSCRIPTION_STATUSES = ['active', 'canceled', 'past_due', 'trialing'] as const
export type SubscriptionStatus = typeof SUBSCRIPTION_STATUSES[number]

// AI Operation Types
export const AI_OPERATION_TYPES = [
  'test_case_generation',
  'bug_report_generation',
  'documentation',
  'report_generation',
] as const
export type AIOperationType = typeof AI_OPERATION_TYPES[number]

// Pagination
export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

// File Upload
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]

// Date Formats
export const DATE_FORMAT = 'MMM dd, yyyy'
export const DATETIME_FORMAT = 'MMM dd, yyyy HH:mm'
export const TIME_FORMAT = 'HH:mm'

// Error Messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'You are not authorized to perform this action',
  NOT_FOUND: 'The requested resource was not found',
  INVALID_INPUT: 'Invalid input provided',
  SERVER_ERROR: 'An unexpected error occurred. Please try again later',
  NETWORK_ERROR: 'Network error. Please check your connection',
}

// Success Messages
export const SUCCESS_MESSAGES = {
  CREATED: 'Successfully created',
  UPDATED: 'Successfully updated',
  DELETED: 'Successfully deleted',
  SAVED: 'Changes saved successfully',
}