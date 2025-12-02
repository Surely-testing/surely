// ============================================
// FILE: lib/utils/date.ts
// Date formatting and manipulation utilities
// ============================================

/**
 * Format a date string to a localized date format
 * @param dateString - ISO date string or null/undefined
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string or 'N/A'
 */
export function formatDate(
  dateString: string | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateString) return 'N/A';
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  };
  
  try {
    return new Date(dateString).toLocaleDateString('en-US', defaultOptions);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
}

/**
 * Format a date string to a localized date and time format
 * @param dateString - ISO date string or null/undefined
 * @returns Formatted date and time string or 'N/A'
 */
export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';
  
  try {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch (error) {
    console.error('Error formatting date time:', error);
    return 'Invalid Date';
  }
}

/**
 * Format a date string to relative time (e.g., "2 hours ago", "3 days ago")
 * @param dateString - ISO date string or null/undefined
 * @returns Relative time string or 'N/A'
 */
export function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    }
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `${diffInWeeks} ${diffInWeeks === 1 ? 'week' : 'weeks'} ago`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
    }
    
    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears} ${diffInYears === 1 ? 'year' : 'years'} ago`;
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'Invalid Date';
  }
}

/**
 * Calculate days remaining until a deadline
 * @param endDate - ISO date string or null/undefined
 * @returns Object with days remaining and formatted message
 */
export function getDaysRemaining(endDate: string | null | undefined): {
  days: number;
  message: string;
  isOverdue: boolean;
  isDueToday: boolean;
} {
  if (!endDate) {
    return {
      days: 0,
      message: 'No deadline',
      isOverdue: false,
      isDueToday: false,
    };
  }
  
  try {
    const end = new Date(endDate);
    const today = new Date();
    
    // Reset time to midnight for accurate day calculation
    end.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      const absDays = Math.abs(diffDays);
      return {
        days: diffDays,
        message: `${absDays} ${absDays === 1 ? 'day' : 'days'} overdue`,
        isOverdue: true,
        isDueToday: false,
      };
    }
    
    if (diffDays === 0) {
      return {
        days: 0,
        message: 'Due today',
        isOverdue: false,
        isDueToday: true,
      };
    }
    
    if (diffDays === 1) {
      return {
        days: 1,
        message: '1 day left',
        isOverdue: false,
        isDueToday: false,
      };
    }
    
    return {
      days: diffDays,
      message: `${diffDays} days left`,
      isOverdue: false,
      isDueToday: false,
    };
  } catch (error) {
    console.error('Error calculating days remaining:', error);
    return {
      days: 0,
      message: 'Invalid date',
      isOverdue: false,
      isDueToday: false,
    };
  }
}

/**
 * Check if a date is in the past
 * @param dateString - ISO date string or null/undefined
 * @returns Boolean indicating if date is in the past
 */
export function isPastDate(dateString: string | null | undefined): boolean {
  if (!dateString) return false;
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    return date < now;
  } catch (error) {
    console.error('Error checking if past date:', error);
    return false;
  }
}

/**
 * Check if a date is today
 * @param dateString - ISO date string or null/undefined
 * @returns Boolean indicating if date is today
 */
export function isToday(dateString: string | null | undefined): boolean {
  if (!dateString) return false;
  
  try {
    const date = new Date(dateString);
    const today = new Date();
    
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  } catch (error) {
    console.error('Error checking if today:', error);
    return false;
  }
}

/**
 * Get date range description
 * @param startDate - ISO date string or null/undefined
 * @param endDate - ISO date string or null/undefined
 * @returns Formatted date range string
 */
export function getDateRange(
  startDate: string | null | undefined,
  endDate: string | null | undefined
): string {
  if (!startDate && !endDate) return 'No dates set';
  if (!startDate) return `Until ${formatDate(endDate)}`;
  if (!endDate) return `From ${formatDate(startDate)}`;
  
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

/**
 * Calculate duration between two dates
 * @param startDate - ISO date string or null/undefined
 * @param endDate - ISO date string or null/undefined
 * @returns Duration object with days, weeks, and formatted message
 */
export function calculateDuration(
  startDate: string | null | undefined,
  endDate: string | null | undefined
): {
  days: number;
  weeks: number;
  message: string;
} {
  if (!startDate || !endDate) {
    return {
      days: 0,
      weeks: 0,
      message: 'N/A',
    };
  }
  
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);
    
    if (diffDays < 0) {
      return {
        days: 0,
        weeks: 0,
        message: 'Invalid range',
      };
    }
    
    if (diffDays === 0) {
      return {
        days: 0,
        weeks: 0,
        message: 'Same day',
      };
    }
    
    if (diffDays === 1) {
      return {
        days: 1,
        weeks: 0,
        message: '1 day',
      };
    }
    
    if (diffDays < 7) {
      return {
        days: diffDays,
        weeks: 0,
        message: `${diffDays} days`,
      };
    }
    
    if (diffWeeks === 1) {
      return {
        days: diffDays,
        weeks: 1,
        message: '1 week',
      };
    }
    
    return {
      days: diffDays,
      weeks: diffWeeks,
      message: `${diffWeeks} weeks`,
    };
  } catch (error) {
    console.error('Error calculating duration:', error);
    return {
      days: 0,
      weeks: 0,
      message: 'Invalid date',
    };
  }
}