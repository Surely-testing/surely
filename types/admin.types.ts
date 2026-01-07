// ============================================
// types/admin.ts
// ============================================

export interface Profile {
  id: string
  email: string
  name: string
  bio?: string | null
  company?: string | null
  location?: string | null
  website?: string | null
  avatar_url?: string | null
  account_type: string
  organization_id?: string | null
  metadata?: any
  created_at?: string | null
  updated_at?: string | null
  created_by?: string | null
  role?: string | null
  status?: string | null
  timezone?: string | null
  theme?: string | null
}

export interface Subscription {
  id: string
  user_id: string
  tier_id?: string | null
  status: string
  billing_cycle?: string | null
  current_period_start?: string | null
  current_period_end?: string | null
  trial_start?: string | null
  trial_end?: string | null
  cancel_at_period_end?: boolean | null
  dodo_subscription_id?: string | null
  dodo_customer_id?: string | null
  stripe_subscription_id?: string | null
  stripe_customer_id?: string | null
  created_at?: string | null
  updated_at?: string | null
  // Joined data
  user_email?: string
  user_name?: string
  tier_name?: string | null
}

export interface Payment {
  id: string
  user_id: string
  subscription_id?: string | null
  amount: number
  currency: string
  status: string
  payment_method?: string | null
  dodo_payment_id: string
  created_at: string
  updated_at: string
  // Joined data
  user_email?: string
  user_name?: string
}

export interface Review {
  id: string
  name: string
  email: string
  rating: number
  review: string
  company?: string | null
  role?: string | null
  photo_url?: string | null
  status?: string | null
  featured?: boolean | null
  created_at?: string | null
  updated_at?: string | null
}

export interface ContactSales {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string | null
  company_name: string
  company_size?: string | null
  message?: string | null
  status?: string | null
  hear_about?: string | null
  timezone?: string | null
  created_at?: string | null
  updated_at?: string | null
}

// Simplified types for dashboard data
export interface RecentSubscription {
  id: string
  status: string
  user_email: string
  tier_name: string | null
  created_at: string | null
}

export interface RecentPayment {
  id: string
  amount: number
  status: string
  user_email: string
  created_at: string
}

export interface DashboardStats {
  totalUsers: number
  activeSubscriptions: number
  trialingSubscriptions: number
  totalRevenue: number
  monthlyRecurringRevenue: number
  pendingReviews: number
  pendingContacts: number
  recentUsers: Profile[]
  recentSubscriptions: RecentSubscription[]
  recentPayments: RecentPayment[]
}

export type AdminSection = 
  | 'overview' 
  | 'users' 
  | 'subscriptions' 
  | 'payments' 
  | 'reviews' 
  | 'contacts'