// ============================================
// FILE: app/api/ai/chat/route.ts
// Fixed cookies import for Next.js 15
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { aiService } from '@/lib/ai/ai-service'
import { aiLogger } from '@/lib/ai/ai-logger'
import type { ChatContext, AIUsageLogInput } from '@/lib/ai/types'
import type { Database } from '@/types/database.types'

// Request body type
interface ChatRequestBody {
  message: string
  context: {
    currentPage?: string
    suiteId?: string | null
    suiteName?: string | null
    pageData?: any
  }
  conversationHistory?: Array<{ role: string; content: string }>
}

// Suggestion type
interface Suggestion {
  id: string
  type: 'action' | 'info' | 'warning'
  title: string
  description: string
  action: {
    label: string
    handler: string
  }
  priority: 'high' | 'medium' | 'low'
  dismissed: boolean
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const cookieStore = await cookies()
    
    // Create Supabase client for server-side
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Handle cookies in middleware/route handlers
            }
          },
        },
      }
    )
    
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: ChatRequestBody = await request.json()
    const { message, context, conversationHistory } = body

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Verify user has access to the test suite
    if (context.suiteId) {
      const { data: suite, error } = await supabase
        .from('test_suites')
        .select('id, created_by, admins, members')
        .eq('id', context.suiteId)
        .single()

      if (error || !suite) {
        return NextResponse.json({ error: 'Test suite not found' }, { status: 404 })
      }

      // Type assertion to handle the suite data structure
      const suiteData = suite as {
        id: string
        created_by: string
        admins: string[] | null
        members: string[] | null
      }

      const hasAccess = 
        suiteData.created_by === user.id ||
        suiteData.admins?.includes(user.id) ||
        suiteData.members?.includes(user.id)

      if (!hasAccess) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    // Build chat context with proper types
    const chatContext: ChatContext = {
      currentPage: context.currentPage || '',
      suiteId: context.suiteId || null,
      suiteName: context.suiteName || null,
      userId: user.id,
      conversationHistory: conversationHistory || [],
      pageData: context.pageData
    }

    // Call AI service
    const result = await aiService.chatWithContext(message, chatContext)

    if (!result.success || !result.data) {
      return NextResponse.json({
        response: result.userMessage || 'Failed to generate response',
        error: result.error
      }, { status: 500 })
    }

    const duration = Date.now() - startTime

    // Log to Supabase (non-blocking)
    if (context.suiteId) {
      const logData: AIUsageLogInput = {
        user_id: user.id,
        suite_id: context.suiteId,
        operation_type: 'dashboard_chat',
        operation_name: 'AI Chat Assistance',
        provider: 'gemini',
        model: result.data.model || 'unknown',
        tokens_used: result.data.tokensUsed || 0,
        input_tokens: result.data.inputTokens ?? 0,
        output_tokens: result.data.outputTokens ?? 0,
        cost: result.data.cost ?? 0,
        cost_breakdown: result.data.costBreakdown,
        success: true,
        prompt_summary: message.substring(0, 200),
        prompt_length: message.length,
        response_summary: result.data.content.substring(0, 200),
        response_length: result.data.content.length,
        duration_ms: duration,
        metadata: {
          page: context.currentPage,
          conversationLength: conversationHistory?.length || 0
        }
      }

      aiLogger.logUsage(logData)
        .catch(err => console.error('Failed to log AI usage:', err))
    }

    // Extract suggestions from response
    const suggestions = extractSuggestions(result.data.content, context)

    return NextResponse.json({
      response: result.data.content,
      suggestions,
      metadata: {
        model: result.data.model,
        tokensUsed: result.data.tokensUsed,
        cost: result.data.cost,
        costBreakdown: result.data.costBreakdown,
        duration: duration
      }
    })

  } catch (error: any) {
    console.error('AI Chat API Error:', error)
    return NextResponse.json(
      { 
        response: "I apologize, but I'm having trouble processing your request. Please try again.",
        error: error.message 
      },
      { status: 500 }
    )
  }
}

function extractSuggestions(
  response: string, 
  context: ChatRequestBody['context']
): Suggestion[] {
  const suggestions: Suggestion[] = []
  const lower = response.toLowerCase()

  interface SuggestionPattern {
    keywords: string[]
    suggestion: Suggestion
  }

  const patterns: SuggestionPattern[] = [
    {
      keywords: ['create project', 'new project', 'start a project'],
      suggestion: {
        id: `suggest-${Date.now()}-1`,
        type: 'action',
        title: 'Create New Project',
        description: 'Start a new project with AI-guided setup',
        action: { label: 'Create Project', handler: 'navigate:/projects/new' },
        priority: 'high',
        dismissed: false
      }
    },
    {
      keywords: ['add task', 'create task', 'new task'],
      suggestion: {
        id: `suggest-${Date.now()}-2`,
        type: 'action',
        title: 'Create Task',
        description: 'Add a new task to your project',
        action: { label: 'New Task', handler: 'navigate:/tasks/new' },
        priority: 'medium',
        dismissed: false
      }
    },
    {
      keywords: ['test case', 'generate test', 'testing'],
      suggestion: {
        id: `suggest-${Date.now()}-3`,
        type: 'action',
        title: 'Generate Test Cases',
        description: 'Use AI to create comprehensive test cases',
        action: { label: 'Generate Tests', handler: 'navigate:/test-cases/generate' },
        priority: 'high',
        dismissed: false
      }
    }
  ]

  for (const pattern of patterns) {
    if (pattern.keywords.some(kw => lower.includes(kw))) {
      suggestions.push(pattern.suggestion)
      break // Only add one suggestion
    }
  }

  return suggestions
}