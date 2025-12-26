// ============================================
// FILE: lib/utils/heading-id.ts
// Centralized heading ID generation
// ============================================

/**
 * Generate a stable, URL-safe ID from heading text
 */
export function generateHeadingId(text: string, position: number): string {
  if (!text || !text.trim()) {
    return `heading-${position}`
  }

  // Clean the text: lowercase, remove special chars, replace spaces with hyphens
  const cleaned = text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .substring(0, 50) // Limit length

  // Add position as suffix to ensure uniqueness for duplicate headings
  return `heading-${cleaned}-${position}`
}