// ============================================
// FILE: lib/dodo/client.ts
// Server-side DodoPayments client - FIXED
// ============================================
import DodoPayments from 'dodopayments'

if (!process.env.DODO_PAYMENTS_API_KEY) {
  throw new Error('DODO_PAYMENTS_API_KEY environment variable is not set')
}

export const dodoClient = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY,
  environment: (process.env.DODO_PAYMENTS_ENVIRONMENT as 'test_mode' | 'live_mode') || 'test_mode'
})

// Log initialization (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('✓ DodoPayments client initialized:', {
    environment: process.env.DODO_PAYMENTS_ENVIRONMENT || 'test_mode',
    hasApiKey: !!process.env.DODO_PAYMENTS_API_KEY,
    apiKeyPrefix: process.env.DODO_PAYMENTS_API_KEY?.substring(0, 10) + '...'
  })
}