// ============================================
// FILE: lib/dodo/types.ts
// TypeScript types for DodoPayments API based on official documentation
// Source: https://docs.dodopayments.com/api-reference/subscriptions/
// ============================================

/**
 * DodoPayments subscription object based on the official API documentation
 * This matches the actual response structure from the Dodo Payments API
 */
export interface DodoSubscription {
  subscription_id: string
  product_id: string
  customer: {
    customer_id: string
    email: string
    name: string
  }
  status: 'pending' | 'active' | 'canceled' | 'past_due' | 'unpaid' | 'on_hold'
  quantity: number
  recurring_pre_tax_amount: number
  currency: string
  
  // Billing cycle fields
  next_billing_date?: string
  previous_billing_date?: string
  created_at: string
  
  // Cancellation fields
  cancel_at_next_billing_date?: boolean
  cancelled_at?: string | null
  
  // Frequency and period
  payment_frequency_count: number
  payment_frequency_interval: 'Day' | 'Week' | 'Month' | 'Year'
  subscription_period_count: number
  subscription_period_interval: 'Day' | 'Week' | 'Month' | 'Year'
  
  // Optional fields
  billing?: {
    city: string
    country: string
    state: string
    street: string
    zipcode: string
  }
  discount_id?: string
  discount_cycles_remaining?: number
  on_demand?: boolean
  tax_inclusive?: boolean
  trial_period_days?: number
  metadata?: Record<string, any>
  
  // Additional fields from API responses
  [key: string]: any
}

/**
 * Type guard to check if an object is a DodoSubscription
 */
export function isDodoSubscription(obj: any): obj is DodoSubscription {
  return (
    obj &&
    typeof obj === 'object' &&
    'subscription_id' in obj &&
    'status' in obj &&
    'product_id' in obj
  )
}