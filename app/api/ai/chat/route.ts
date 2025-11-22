// ============================================
// FILE: app/api/ai/chat/route.ts
// ============================================
export async function POST(req: Request) {
  const { message, context, conversationHistory } = await req.json()
  
  // Build context-aware system prompt
  const systemPrompt = `You are an AI assistant for Surely, a comprehensive platform with multiple dashboards and suites.

Current Context:
- Page: ${context.currentPage}
- Suite: ${context.suiteName || 'None'}
- Suite ID: ${context.suiteId || 'None'}
- User ID: ${context.userId}

You have full knowledge of:
1. All suite features (projects, tasks, documents, analytics)
2. Cross-suite operations and workflows
3. Best practices for productivity
4. Platform navigation and features

Provide helpful, actionable responses that:
- Reference the specific dashboard/suite they're in
- Suggest concrete next steps
- Offer to perform actions when possible
- Are concise but thorough`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [
          ...conversationHistory.map((msg: any) => ({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content
          })),
          { role: 'user', content: message }
        ]
      })
    })

    const data = await response.json()
    
    return Response.json({
      response: data.content[0].text,
      metadata: {
        model: 'claude-sonnet-4',
        context: context
      }
    })
  } catch (error) {
    console.error('AI API Error:', error)
    return Response.json({ error: 'Failed to get AI response' }, { status: 500 })
  }
}