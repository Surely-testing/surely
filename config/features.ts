// ============================================
// FILE: config/features.ts
// ============================================
export type SubscriptionTier = 'free' | 'pro' | 'enterprise'

export type FeatureFlags = {
  aiTestGeneration: boolean
  advancedAnalytics: boolean
  customIntegrations: boolean
  prioritySupport: boolean
  apiAccess: boolean
  whiteLabel: boolean
  sla: boolean
  customWorkflows: boolean
  dedicatedSupport: boolean
  training: boolean
}

export type TierLimits = {
  testSuites: number // -1 = unlimited
  testCasesPerSuite: number
  aiOperationsPerMonth: number
  teamMembers: number
  storageGB: number
  sprints: number
}

export type TierConfig = {
  name: string
  tier: SubscriptionTier
  displayName: string
  description: string
  price: {
    monthly: number | null
    yearly: number | null
  }
  features: FeatureFlags
  limits: TierLimits
  highlighted?: boolean
}

export const subscriptionTiers: Record<SubscriptionTier, TierConfig> = {
  free: {
    name: 'free',
    tier: 'free',
    displayName: 'Starter',
    description: 'Perfect for individuals and small teams getting started',
    price: {
      monthly: 0,
      yearly: 0,
    },
    features: {
      aiTestGeneration: false,
      advancedAnalytics: false,
      customIntegrations: false,
      prioritySupport: false,
      apiAccess: false,
      whiteLabel: false,
      sla: false,
      customWorkflows: false,
      dedicatedSupport: false,
      training: false,
    },
    limits: {
      testSuites: 1,
      testCasesPerSuite: 50,
      aiOperationsPerMonth: 10,
      teamMembers: 3,
      storageGB: 1,
      sprints: 2,
    },
  },
  pro: {
    name: 'pro',
    tier: 'pro',
    displayName: 'Professional',
    description: 'Best for growing teams and businesses',
    price: {
      monthly: 29,
      yearly: 290, // ~20% discount
    },
    features: {
      aiTestGeneration: true,
      advancedAnalytics: true,
      customIntegrations: true,
      prioritySupport: true,
      apiAccess: true,
      whiteLabel: false,
      sla: false,
      customWorkflows: false,
      dedicatedSupport: false,
      training: false,
    },
    limits: {
      testSuites: 10,
      testCasesPerSuite: 500,
      aiOperationsPerMonth: 100,
      teamMembers: 15,
      storageGB: 50,
      sprints: -1, // unlimited
    },
    highlighted: true,
  },
  enterprise: {
    name: 'enterprise',
    tier: 'enterprise',
    displayName: 'Enterprise',
    description: 'Tailored solutions for large organizations',
    price: {
      monthly: null, // Custom pricing
      yearly: null,
    },
    features: {
      aiTestGeneration: true,
      advancedAnalytics: true,
      customIntegrations: true,
      prioritySupport: true,
      apiAccess: true,
      whiteLabel: true,
      sla: true,
      customWorkflows: true,
      dedicatedSupport: true,
      training: true,
    },
    limits: {
      testSuites: -1, // unlimited
      testCasesPerSuite: -1,
      aiOperationsPerMonth: -1,
      teamMembers: -1,
      storageGB: -1,
      sprints: -1,
    },
  },
}

// Helper function to check if user has feature access
export function hasFeatureAccess(
  tier: SubscriptionTier,
  feature: keyof FeatureFlags
): boolean {
  return subscriptionTiers[tier].features[feature]
}

// Helper function to check limits
export function checkLimit(
  tier: SubscriptionTier,
  limitType: keyof TierLimits,
  currentUsage: number
): { allowed: boolean; limit: number; usage: number; remaining: number } {
  const limit = subscriptionTiers[tier].limits[limitType]
  const unlimited = limit === -1

  return {
    allowed: unlimited || currentUsage < limit,
    limit,
    usage: currentUsage,
    remaining: unlimited ? -1 : Math.max(0, limit - currentUsage),
  }
}

// Feature descriptions for UI
export const featureDescriptions: Record<keyof FeatureFlags, string> = {
  aiTestGeneration: 'AI-powered test case generation from requirements',
  advancedAnalytics: 'Advanced reporting and analytics dashboards',
  customIntegrations: 'Connect with your existing tools via webhooks',
  prioritySupport: 'Priority email and chat support',
  apiAccess: 'Full REST API access for automation',
  whiteLabel: 'Remove Surely branding and use your own',
  sla: 'Service Level Agreement with uptime guarantees',
  customWorkflows: 'Build custom workflows for your team',
  dedicatedSupport: 'Dedicated account manager and support',
  training: 'Personalized onboarding and training sessions',
}