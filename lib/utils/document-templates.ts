// ============================================
// FILE: lib/utils/document-templates.ts
// Comprehensive document templates for different types
// ============================================

export const DOC_TYPES = [
  { 
    value: 'meeting_notes', 
    label: '📝 Meeting Notes',
    description: 'Capture meeting discussions with action items'
  },
  { 
    value: 'test_plan', 
    label: '📋 Test Plan',
    description: 'Structured test planning document'
  },
  { 
    value: 'test_strategy', 
    label: '🎯 Test Strategy',
    description: 'High-level testing strategy'
  },
  { 
    value: 'brainstorm', 
    label: '💡 Brainstorm',
    description: 'Creative ideation and brainstorming'
  },
  { 
    value: 'general', 
    label: '📄 General',
    description: 'General purpose document'
  },
] as const

export type DocType = typeof DOC_TYPES[number]['value']

export const DOCUMENT_TEMPLATES: Record<DocType, any> = {
  test_plan: {
    type: 'doc',
    content: [
      { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Test Plan' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '1. Introduction' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'Purpose and scope of this test plan...' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '2. Test Objectives' }] },
      { type: 'bulletList', content: [
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Verify all functional requirements' }] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Ensure system reliability' }] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Validate user experience' }] }] },
      ]},
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '3. Scope' }] },
      { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'In Scope' }] },
      { type: 'bulletList', content: [
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Functional testing' }] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Integration testing' }] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Regression testing' }] }] },
      ]},
      { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Out of Scope' }] },
      { type: 'bulletList', content: [
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Performance testing' }] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Security testing' }] }] },
      ]},
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '4. Test Strategy' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'Overall approach and methodology...' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '5. Test Environment' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'Hardware and software requirements...' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '6. Test Schedule' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'Timeline and milestones...' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '7. Risk & Mitigation' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'Identified risks and mitigation strategies...' }] },
    ]
  },

  test_strategy: {
    type: 'doc',
    content: [
      { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Test Strategy' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Executive Summary' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'High-level overview of our testing approach and quality objectives...' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Testing Approach' }] },
      { type: 'bulletList', content: [
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Risk-based testing prioritization' }] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Continuous testing in CI/CD pipeline' }] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Test automation strategy and framework' }] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Shift-left testing practices' }] }] },
      ]},
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Quality Metrics & KPIs' }] },
      { type: 'bulletList', content: [
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Test coverage percentage' }] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Defect detection rate' }] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Test execution velocity' }] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Mean time to detect (MTTD)' }] }] },
      ]},
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Test Types & Coverage' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'Define which test types will be executed and their coverage targets...' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Resource Allocation' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'Team structure, roles, and responsibilities...' }] },
    ]
  },

  meeting_notes: {
    type: 'doc',
    content: [
      { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Meeting Notes' }] },
      { type: 'paragraph', content: [
        { type: 'text', marks: [{ type: 'bold' }], text: 'Date: ' },
        { type: 'text', text: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }
      ]},
      { type: 'paragraph', content: [
        { type: 'text', marks: [{ type: 'bold' }], text: 'Attendees: ' },
      ]},
      { type: 'paragraph', content: [
        { type: 'text', marks: [{ type: 'bold' }], text: 'Location: ' },
      ]},
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Agenda' }] },
      { type: 'orderedList', content: [
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Topic 1' }] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Topic 2' }] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Topic 3' }] }] },
      ]},
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Discussion Points' }] },
      { type: 'paragraph' },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Action Items' }] },
      { type: 'taskList', content: [
        { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Action item 1 - Owner - Due date' }] }] },
        { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Action item 2 - Owner - Due date' }] }] },
      ]},
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Decisions Made' }] },
      { type: 'bulletList', content: [
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Decision 1' }] }] },
      ]},
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Next Steps' }] },
      { type: 'paragraph' },
    ]
  },

  brainstorm: {
    type: 'doc',
    content: [
      { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Brainstorm Session' }] },
      { type: 'paragraph', content: [
        { type: 'text', marks: [{ type: 'italic' }], text: 'Let your ideas flow freely. No judgment, just creativity!' }
      ]},
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Central Topic' }] },
      { type: 'paragraph' },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Ideas' }] },
      { type: 'bulletList', content: [
        { type: 'listItem', content: [{ type: 'paragraph' }] },
      ]},
    ]
  },

  general: {
    type: 'doc',
    content: [
      { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Untitled Document' }] },
      { type: 'paragraph' },
    ]
  }
}

/**
 * Get template for a document type
 */
export function getDocumentTemplate(docType: DocType) {
  return DOCUMENT_TEMPLATES[docType] || DOCUMENT_TEMPLATES.general
}

/**
 * Check if content is empty (only has default/empty structure)
 */
export function isContentEmpty(content: any): boolean {
  if (!content || !content.content) return true
  
  // Check if there's any actual text content
  const hasText = (node: any): boolean => {
    if (node.type === 'text' && node.text?.trim()) {
      return true
    }
    if (node.content && Array.isArray(node.content)) {
      return node.content.some(hasText)
    }
    return false
  }
  
  return !hasText(content)
}

/**
 * AI context for different document types
 */
export const DOC_TYPE_AI_CONTEXT = {
  meeting_notes: {
    systemPrompt: `You are a meeting assistant. Help organize notes, extract action items, and summarize discussions. Be concise and focus on actionable outcomes.`,
    capabilities: [
      'Extract and organize action items',
      'Identify key decisions and owners',
      'Summarize discussion points',
      'Suggest follow-up tasks',
      'Format notes for clarity'
    ]
  },
  test_plan: {
    systemPrompt: `You are a QA expert helping with test planning. Provide structured, thorough guidance. Consider edge cases and suggest comprehensive coverage.`,
    capabilities: [
      'Generate comprehensive test scenarios',
      'Identify edge cases and risks',
      'Suggest coverage improvements',
      'Review scope and objectives',
      'Recommend testing strategies'
    ]
  },
  test_strategy: {
    systemPrompt: `You are a test strategy advisor. Help create high-level testing strategies and frameworks. Think strategically about quality and recommend best practices.`,
    capabilities: [
      'Develop strategic testing frameworks',
      'Suggest quality metrics and KPIs',
      'Recommend best practices',
      'Analyze risk vs coverage',
      'Advise on resource allocation'
    ]
  },
  brainstorm: {
    systemPrompt: `You are a creative brainstorming assistant. Help explore ideas, generate alternatives, and think creatively. Be enthusiastic and offer diverse perspectives.`,
    capabilities: [
      'Generate creative ideas and alternatives',
      'Explore different perspectives',
      'Create mind maps or frameworks',
      'Suggest related concepts',
      'Help organize thoughts into plans'
    ]
  },
  general: {
    systemPrompt: `You are a helpful writing assistant. Assist with document creation, editing, and improvement. Be clear and adaptable to user needs.`,
    capabilities: [
      'Improve writing clarity and style',
      'Organize content structure',
      'Generate outlines or frameworks',
      'Suggest relevant additions',
      'Help with formatting'
    ]
  }
} as const

/**
 * Get AI context for document type
 */
export function getDocTypeAIContext(docType: DocType) {
  return DOC_TYPE_AI_CONTEXT[docType] || DOC_TYPE_AI_CONTEXT.general
}

/**
 * Get placeholder text for document type
 */
export function getDocTypePlaceholder(docType: DocType): string {
  const placeholders = {
    brainstorm: "Start brainstorming... Type '/' for AI commands",
    meeting_notes: "Take notes... Type '/' for quick actions",
    test_plan: "Begin your test plan... Type '/' for templates",
    test_strategy: "Define your strategy... Type '/' for frameworks",
    general: "Start writing... Type '/' for commands"
  }
  return placeholders[docType] || placeholders.general
}