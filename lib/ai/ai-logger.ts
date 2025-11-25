// ============================================
// FILE: lib/ai/ai-logger.ts
// ============================================
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import type { AIUsageLogInput, UsageStats } from './types'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Type for the complete AI usage log (input + generated fields)
type AIUsageLog = Database['public']['Tables']['ai_usage_logs']['Insert']

// Type for returned log data
type AIUsageLogRow = Database['public']['Tables']['ai_usage_logs']['Row']

export class AILogger {
  // Log AI usage to Supabase
  async logUsage(logData: AIUsageLogInput): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const log: AIUsageLog = {
        id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
        user_id: logData.user_id,
        suite_id: logData.suite_id,
        operation_type: logData.operation_type,
        operation_name: logData.operation_name,
        asset_type: logData.asset_type,
        asset_ids: logData.asset_ids,
        provider: logData.provider,
        model: logData.model,
        tokens_used: logData.tokens_used,
        input_tokens: logData.input_tokens,
        output_tokens: logData.output_tokens,
        cost: logData.cost,
        cost_breakdown: logData.cost_breakdown as any,
        success: logData.success,
        error_message: logData.error_message,
        prompt_summary: logData.prompt_summary,
        prompt_length: logData.prompt_length,
        response_summary: logData.response_summary,
        response_length: logData.response_length,
        duration_ms: logData.duration_ms,
        metadata: logData.metadata as any,
      }

      const { data, error } = await supabase
        .from('ai_usage_logs')
        .insert([log])
        .select()
        .single()

      if (error) {
        console.error('Failed to log AI usage:', error)
        return { success: false, error: error.message }
      }

      console.log('✅ AI usage logged:', log.id)
      return { success: true, id: data.id }
    } catch (error: any) {
      console.error('Exception logging AI usage:', error)
      return { success: false, error: error.message }
    }
  }

  // Get usage statistics for a test suite
  async getSuiteUsageStats(suiteId: string, options: {
    startDate?: string
    endDate?: string
    groupBy?: 'day' | 'week' | 'month'
  } = {}): Promise<{ success: boolean; data?: UsageStats; error?: string }> {
    try {
      let query = supabase
        .from('ai_usage_logs')
        .select('*')
        .eq('suite_id', suiteId)
        .eq('success', true)
        .order('created_at', { ascending: false })

      if (options.startDate) {
        query = query.gte('created_at', options.startDate)
      }

      if (options.endDate) {
        query = query.lte('created_at', options.endDate)
      }

      const { data, error } = await query

      if (error) throw error

      // Calculate statistics
      const stats: UsageStats = {
        totalOperations: data.length,
        totalTokens: data.reduce((sum, log) => sum + (log.tokens_used || 0), 0),
        totalCost: data.reduce((sum, log) => sum + (log.cost || 0), 0),
        byOperationType: this.groupBy(data, 'operation_type'),
        byModel: this.groupBy(data, 'model'),
        averageTokensPerOp: data.length > 0 
          ? data.reduce((sum, log) => sum + (log.tokens_used || 0), 0) / data.length 
          : 0,
        averageCostPerOp: data.length > 0
          ? data.reduce((sum, log) => sum + (log.cost || 0), 0) / data.length
          : 0
      }

      return { success: true, data: stats }
    } catch (error: any) {
      console.error('Failed to get usage stats:', error)
      return { success: false, error: error.message }
    }
  }

  // Get user usage statistics
  async getUserUsageStats(userId: string, options: {
    startDate?: string
    endDate?: string
  } = {}) {
    try {
      let query = supabase
        .from('ai_usage_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('success', true)
        .order('created_at', { ascending: false })

      if (options.startDate) {
        query = query.gte('created_at', options.startDate)
      }

      if (options.endDate) {
        query = query.lte('created_at', options.endDate)
      }

      const { data, error } = await query

      if (error) throw error

      const stats = {
        totalOperations: data.length,
        totalTokens: data.reduce((sum, log) => sum + (log.tokens_used || 0), 0),
        totalCost: data.reduce((sum, log) => sum + (log.cost || 0), 0),
        byOperationType: this.groupBy(data, 'operation_type'),
        recentOperations: data.slice(0, 10)
      }

      return { success: true, data: stats }
    } catch (error: any) {
      console.error('Failed to get user stats:', error)
      return { success: false, error: error.message }
    }
  }

  // Get recent operations
  async getRecentOperations(suiteId: string, limit: number = 50) {
    try {
      const { data, error } = await supabase
        .from('ai_usage_logs')
        .select('*')
        .eq('suite_id', suiteId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return { success: true, data }
    } catch (error: any) {
      console.error('Failed to get recent operations:', error)
      return { success: false, error: error.message }
    }
  }

  // Get cost breakdown by time period
  async getCostBreakdown(suiteId: string, options: {
    startDate: string
    endDate: string
    groupBy: 'day' | 'week' | 'month'
  }) {
    try {
      const { data, error } = await supabase
        .from('ai_usage_logs')
        .select('created_at, cost, operation_type, tokens_used')
        .eq('suite_id', suiteId)
        .eq('success', true)
        .gte('created_at', options.startDate)
        .lte('created_at', options.endDate)
        .order('created_at', { ascending: true })

      if (error) throw error

      // Group by time period
      const grouped = this.groupByTimePeriod(data, options.groupBy)

      return { success: true, data: grouped }
    } catch (error: any) {
      console.error('Failed to get cost breakdown:', error)
      return { success: false, error: error.message }
    }
  }

  // Helper: Group data by field
  private groupBy(data: AIUsageLogRow[], field: keyof AIUsageLogRow) {
    return data.reduce((acc, item) => {
      const key = (item[field] as string) || 'unknown'
      if (!acc[key]) {
        acc[key] = {
          count: 0,
          tokens: 0,
          cost: 0
        }
      }
      acc[key].count++
      acc[key].tokens += item.tokens_used || 0
      acc[key].cost += item.cost || 0
      return acc
    }, {} as Record<string, { count: number; tokens: number; cost: number }>)
  }

  // Helper: Group by time period
  private groupByTimePeriod(
    data: Array<{ created_at: string; cost: number; operation_type: string; tokens_used: number }>, 
    groupBy: 'day' | 'week' | 'month'
  ) {
    return data.reduce((acc, item) => {
      const date = new Date(item.created_at)
      let key: string

      switch (groupBy) {
        case 'day':
          key = date.toISOString().split('T')[0]
          break
        case 'week':
          const weekStart = new Date(date.setDate(date.getDate() - date.getDay()))
          key = weekStart.toISOString().split('T')[0]
          break
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          break
        default:
          key = date.toISOString().split('T')[0]
      }

      if (!acc[key]) {
        acc[key] = {
          date: key,
          operations: 0,
          cost: 0,
          tokens: 0,
          byType: {} as Record<string, { count: number; cost: number }>
        }
      }

      acc[key].operations++
      acc[key].cost += item.cost || 0
      acc[key].tokens += item.tokens_used || 0

      const type = item.operation_type || 'unknown'
      if (!acc[key].byType[type]) {
        acc[key].byType[type] = { count: 0, cost: 0 }
      }
      acc[key].byType[type].count++
      acc[key].byType[type].cost += item.cost || 0

      return acc
    }, {} as Record<string, {
      date: string
      operations: number
      cost: number
      tokens: number
      byType: Record<string, { count: number; cost: number }>
    }>)
  }
}

// Export singleton
export const aiLogger = new AILogger()