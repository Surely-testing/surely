// ============================================
// FILE: lib/ai/document-context.ts
// Helper to provide document context to main AI assistant
// ============================================

/**
 * Generates AI context for the main assistant when user is in document editor
 * This ensures the main AI assistant understands the current document state
 */
export function generateDocumentContext(document: {
  id: string
  title: string
  type: string
  content: any
  headings?: any[]
}) {
  const typeDescriptions = {
    brainstorm: 'brainstorming document for ideation',
    meeting_notes: 'meeting notes with action items and decisions',
    test_plan: 'structured test plan with objectives and strategy',
    test_strategy: 'high-level test strategy document',
    general: 'general purpose document'
  }

  const typeDescription = typeDescriptions[document.type as keyof typeof typeDescriptions] || 'document'

  // Extract text content from Tiptap JSON
  const extractText = (node: any): string => {
    if (!node) return ''
    
    if (node.type === 'text') {
      return node.text || ''
    }
    
    if (node.content && Array.isArray(node.content)) {
      return node.content.map(extractText).join(' ')
    }
    
    return ''
  }

  const contentText = extractText(document.content).substring(0, 3000)
  const wordCount = contentText.split(/\s+/).filter(Boolean).length

  // Build context string
  let context = `\n\n=== DOCUMENT EDITOR CONTEXT ===
Currently editing document: "${document.title}"
Document Type: ${document.type.replace('_', ' ')} (${typeDescription})
Word Count: ~${wordCount}
Sections: ${document.headings?.length || 0} headings

Content Preview:
${contentText.substring(0, 1000)}${contentText.length > 1000 ? '...' : ''}

DOCUMENT-SPECIFIC CAPABILITIES:
Based on the document type (${document.type}), you can help with:
`

  // Add type-specific capabilities
  const capabilities = {
    brainstorm: `- Generate creative ideas and alternatives
- Explore different perspectives and angles
- Create mind maps or structured idea frameworks
- Suggest related concepts or connections
- Help organize thoughts into actionable plans`,

    meeting_notes: `- Extract and organize action items
- Identify key decisions and owners
- Summarize discussion points
- Suggest follow-up tasks
- Format notes for better clarity`,

    test_plan: `- Generate comprehensive test scenarios
- Identify edge cases and risks
- Suggest coverage improvements
- Review scope and objectives
- Recommend testing strategies`,

    test_strategy: `- Develop strategic testing frameworks
- Suggest quality metrics and KPIs
- Recommend best practices
- Analyze risk vs coverage
- Advise on resource allocation`,

    general: `- Improve writing clarity and style
- Organize content structure
- Generate outlines or frameworks
- Suggest relevant additions
- Help with formatting and presentation`
  }

  context += capabilities[document.type as keyof typeof capabilities] || capabilities.general

  context += `\n\nDOCUMENT WRITING ASSISTANCE:
- Check grammar and spelling
- Rewrite text in different styles (professional, casual, technical, concise)
- Improve clarity and readability
- Expand or condense sections
- Suggest better wording

USER INSTRUCTIONS:
When the user asks questions or requests help, provide assistance specific to their ${typeDescription}.
Reference their actual document content when relevant.
Offer to generate, improve, or restructure sections of their document.`

  return context
}

/**
 * Generates quick action prompts for the document type
 */
export function getDocumentQuickActions(docType: string) {
  const actions = {
    brainstorm: [
      { label: 'Generate Ideas', prompt: 'Generate 5 creative ideas related to my document topic' },
      { label: 'Pros & Cons', prompt: 'Create a pros and cons analysis for the main concept' },
      { label: 'Expand Section', prompt: 'Help me expand the ideas in this document' },
      { label: 'Structure Ideas', prompt: 'Help me organize these ideas into a logical structure' },
    ],
    meeting_notes: [
      { label: 'Extract Actions', prompt: 'Extract all action items from these meeting notes' },
      { label: 'Summarize', prompt: 'Summarize the key points from this meeting' },
      { label: 'Find Decisions', prompt: 'Identify all decisions made in this meeting' },
      { label: 'Next Steps', prompt: 'What are the recommended next steps based on these notes?' },
    ],
    test_plan: [
      { label: 'Test Scenarios', prompt: 'Generate test scenarios for this test plan' },
      { label: 'Find Gaps', prompt: 'Identify coverage gaps in this test plan' },
      { label: 'Risk Analysis', prompt: 'Analyze testing risks in this plan' },
      { label: 'Improve Plan', prompt: 'Suggest improvements for this test plan' },
    ],
    test_strategy: [
      { label: 'Strategic Framework', prompt: 'Help develop a strategic testing framework' },
      { label: 'Quality Metrics', prompt: 'Suggest quality metrics for this strategy' },
      { label: 'Best Practices', prompt: 'Recommend testing best practices' },
      { label: 'Review Strategy', prompt: 'Review and improve this test strategy' },
    ],
    general: [
      { label: 'Improve Writing', prompt: 'Improve the writing in this document' },
      { label: 'Create Outline', prompt: 'Create an outline based on this content' },
      { label: 'Expand Content', prompt: 'Help me expand this document with more details' },
      { label: 'Proofread', prompt: 'Proofread this document for errors' },
    ]
  }

  return actions[docType as keyof typeof actions] || actions.general
}

/**
 * Generates system prompt override for document-specific AI interactions
 */
export function getDocumentSystemPrompt(docType: string): string {
  const prompts = {
    brainstorm: `You are a creative brainstorming assistant. Help users explore ideas, generate alternatives, and think creatively. Be enthusiastic, offer diverse perspectives, and build on user's ideas.`,

    meeting_notes: `You are a meeting assistant. Help users organize notes, extract action items, and summarize discussions. Be concise, structured, and focus on actionable outcomes.`,

    test_plan: `You are a QA expert helping with test planning. Provide structured, thorough test planning guidance. Be systematic, consider edge cases, and suggest comprehensive coverage.`,

    test_strategy: `You are a test strategy advisor. Help create high-level testing strategies and frameworks. Think strategically about quality, recommend best practices, and balance thoroughness with practicality.`,

    general: `You are a helpful writing assistant. Assist with document creation, editing, and improvement. Be clear, adaptable, and provide actionable suggestions.`
  }

  return prompts[docType as keyof typeof prompts] || prompts.general
}