// ============================================
// utils/domainValidator.ts
// New domain validation for email addresses
// ============================================

/**
 * List of common public email providers that are not allowed for organization accounts
 */
const COMMON_EMAIL_PROVIDERS = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'icloud.com',
  'aol.com',
  'protonmail.com',
  'mail.com',
  'zoho.com',
  'yandex.com',
  'gmx.com',
  'inbox.com',
  'hey.com',
  'fastmail.com',
  'venia.cloud'
  // Add more as needed
]

/**
 * Check if an email uses a common public email provider
 */
export function isCommonEmailProvider(email: string): boolean {
  if (!email || !email.includes('@')) return false
  
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return false
  
  return COMMON_EMAIL_PROVIDERS.includes(domain)
}

/**
 * Extract domain from email address
 */
export function extractDomain(email: string): string | null {
  if (!email || !email.includes('@')) return null
  
  const domain = email.split('@')[1]?.toLowerCase()
  return domain || null
}

/**
 * Check if two emails are from the same domain
 */
export function isSameDomain(email1: string, email2: string): boolean {
  const domain1 = extractDomain(email1)
  const domain2 = extractDomain(email2)
  
  if (!domain1 || !domain2) return false
  
  return domain1 === domain2
}

/**
 * Validate if an email is allowed for an organization
 * Returns { valid: boolean, reason?: string }
 */
export function validateOrganizationEmail(
  inviteeEmail: string,
  organizationDomain: string
): { valid: boolean; reason?: string } {
  const inviteeDomain = extractDomain(inviteeEmail)
  
  if (!inviteeDomain) {
    return { valid: false, reason: 'Invalid email format' }
  }
  
  // Check if using common provider (not allowed for org accounts)
  if (isCommonEmailProvider(inviteeEmail)) {
    return {
      valid: false,
      reason: `Cannot invite ${inviteeEmail}. Organization members must use the company email domain (@${organizationDomain}).`,
    }
  }
  
  // Check if domain matches organization domain
  if (inviteeDomain !== organizationDomain.toLowerCase()) {
    return {
      valid: false,
      reason: `Email domain (@${inviteeDomain}) does not match organization domain (@${organizationDomain}). All members must use @${organizationDomain} emails.`,
    }
  }
  
  return { valid: true }
}

/**
 * Get organization domain from owner's email
 * This is used when organization table doesn't have a domain column
 */
export function getOrganizationDomainFromEmail(ownerEmail: string): string | null {
  return extractDomain(ownerEmail)
}

/**
 * Validate email format
 * @param {string} email - The email address to validate
 * @returns {boolean} - True if valid email format, false otherwise
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Check if an email uses a custom domain (not a common email provider)
 * @param {string} email - The email address to check
 * @returns {boolean} - True if it's a custom domain, false otherwise
 */
export function isCustomDomain(email: string): boolean {
  return !isCommonEmailProvider(email)
}

/**
 * Extract a clean domain name from an email for organization naming
 * @param {string} email - The email address
 * @returns {string} - Clean domain name suitable for organization naming
 */
export function extractDomainName(email: string): string {
  if (!email || typeof email !== 'string') return ''
  
  const domain = email.toLowerCase().split('@')[1]
  if (!domain) return ''
  
  // Remove common TLDs and subdomains to get a clean name
  const parts = domain.split('.')
  
  // If it's a common provider, return empty string
  if (COMMON_EMAIL_PROVIDERS.includes(domain)) {
    return ''
  }
  
  // For custom domains, try to extract a meaningful name
  if (parts.length >= 2) {
    // Remove the TLD (last part) and use the second-to-last part
    const baseName = parts[parts.length - 2]
    
    // Capitalize first letter and return
    return baseName.charAt(0).toUpperCase() + baseName.slice(1)
  }
  
  return domain
}

/**
 * Generate organization name suggestions based on email domain
 * @param {string} email - The email address
 * @returns {string[]} - Array of suggested organization names
 */
export function generateOrgNameSuggestions(email: string): string[] {
  const domainName = extractDomainName(email)
  if (!domainName) return []
  
  const suggestions = [
    domainName,
    `${domainName} Inc`,
    `${domainName} LLC`,
    `${domainName} Corp`,
    `${domainName} Company`,
    `${domainName} Solutions`,
    `${domainName} Technologies`
  ]
  
  return suggestions
}

/**
 * Check if domain suggests business/organization use
 * @param {string} email - The email address to check
 * @returns {boolean} - True if it looks like a business domain
 */
export function isBusinessDomain(email: string): boolean {
  if (!isCustomDomain(email)) return false
  
  const domain = email.toLowerCase().split('@')[1]
  if (!domain) return false
  
  // Common business domain indicators
  const businessIndicators = [
    'corp',
    'inc',
    'llc',
    'ltd',
    'company',
    'co',
    'biz',
    'org',
    'net',
    'solutions',
    'tech',
    'software',
    'consulting',
    'services',
    'group',
    'systems',
    'enterprises'
  ]
  
  return businessIndicators.some(indicator => 
    domain.includes(indicator) || domain.endsWith(`.${indicator}`)
  )
}

/**
 * Get recommended account type based on email
 * @param {string} email - The email address
 * @returns {'individual'|'organization'} - Recommended account type
 */
export function getRecommendedAccountType(email: string): 'individual' | 'organization' {
  if (!email || !isValidEmail(email)) return 'individual'
  
  if (isCommonEmailProvider(email)) {
    return 'individual'
  }
  
  // Custom domain suggests organization, especially if it looks business-like
  if (isBusinessDomain(email)) {
    return 'organization'
  }
  
  // Default to organization for any custom domain
  return isCustomDomain(email) ? 'organization' : 'individual'
}