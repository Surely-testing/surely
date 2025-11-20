// utils/domainValidation.js

// Common email providers that should be considered personal accounts
const COMMON_EMAIL_PROVIDERS = [
    'gmail.com',
    'yahoo.com',
    'hotmail.com',
    'outlook.com',
    'icloud.com',
    'aol.com',
    'protonmail.com',
    'tutanota.com',
    'zoho.com',
    'yandex.com',
    'mail.com',
    'gmx.com',
    'live.com',
    'msn.com',
    'me.com',
    'mac.com'
];

/**
 * Check if an email uses a common email provider
 * @param {string} email - The email address to check
 * @returns {boolean} - True if it's a common provider, false otherwise
 */
export const isCommonEmailProvider = (email: string): boolean => {
    if (!email || typeof email !== 'string') return false;
    
    const domain = email.toLowerCase().split('@')[1];
    if (!domain) return false;
    
    return COMMON_EMAIL_PROVIDERS.includes(domain);
};

/**
 * Check if an email uses a custom domain (not a common email provider)
 * @param {string} email - The email address to check
 * @returns {boolean} - True if it's a custom domain, false otherwise
 */
export const isCustomDomain = (email: string): boolean => {
    return !isCommonEmailProvider(email);
};

/**
 * Extract a clean domain name from an email for organization naming
 * @param {string} email - The email address
 * @returns {string} - Clean domain name suitable for organization naming
 */
export const extractDomainName = (email: string): string => {
    if (!email || typeof email !== 'string') return '';
    
    const domain = email.toLowerCase().split('@')[1];
    if (!domain) return '';
    
    // Remove common TLDs and subdomains to get a clean name
    const parts = domain.split('.');
    
    // If it's a common provider, return empty string
    if (COMMON_EMAIL_PROVIDERS.includes(domain)) {
        return '';
    }
    
    // For custom domains, try to extract a meaningful name
    if (parts.length >= 2) {
        // Remove the TLD (last part) and use the second-to-last part
        const baseName = parts[parts.length - 2];
        
        // Capitalize first letter and return
        return baseName.charAt(0).toUpperCase() + baseName.slice(1);
    }
    
    return domain;
};

/**
 * Generate organization name suggestions based on email domain
 * @param {string} email - The email address
 * @returns {string[]} - Array of suggested organization names
 */
export const generateOrgNameSuggestions = (email: string): string[] => {
    const domainName = extractDomainName(email);
    if (!domainName) return [];
    
    const suggestions = [
        domainName,
        `${domainName} Inc`,
        `${domainName} LLC`,
        `${domainName} Corp`,
        `${domainName} Company`,
        `${domainName} Solutions`,
        `${domainName} Technologies`
    ];
    
    return suggestions;
};

/**
 * Validate email format
 * @param {string} email - The email address to validate
 * @returns {boolean} - True if valid email format, false otherwise
 */
export const isValidEmail = (email: string): boolean => {
    if (!email || typeof email !== 'string') return false;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Check if domain suggests business/organization use
 * @param {string} email - The email address to check
 * @returns {boolean} - True if it looks like a business domain
 */
export const isBusinessDomain = (email: string): boolean => {
    if (!isCustomDomain(email)) return false;
    
    const domain = email.toLowerCase().split('@')[1];
    if (!domain) return false;
    
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
    ];
    
    return businessIndicators.some(indicator => 
        domain.includes(indicator) || domain.endsWith(`.${indicator}`)
    );
};

/**
 * Get recommended account type based on email
 * @param {string} email - The email address
 * @returns {'individual'|'organization'} - Recommended account type
 */
export const getRecommendedAccountType = (email: string): 'individual' | 'organization' => {
    if (!email || !isValidEmail(email)) return 'individual';
    
    if (isCommonEmailProvider(email)) {
        return 'individual';
    }
    
    // Custom domain suggests organization, especially if it looks business-like
    if (isBusinessDomain(email)) {
        return 'organization';
    }
    
    // Default to organization for any custom domain
    return isCustomDomain(email) ? 'organization' : 'individual';
};