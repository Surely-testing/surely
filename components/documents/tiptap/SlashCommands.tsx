// ============================================
// FILE: components/documents/SlashCommands.tsx
// Enhanced with more Notion-style commands
// ============================================
'use client'

import { useState, useEffect } from 'react'
import { Editor } from '@tiptap/react'
import { Card } from '@/components/ui/Card'
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Table,
  Minus,
  Image,
  Text,
  Type,
  MessageSquare,
  AlertCircle,
  Info,
  Lightbulb,
  Link2,
  FileText,
  Calendar,
  Clock,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const SLASH_COMMANDS = [
  // Text blocks
  {
    icon: Text,
    title: 'Text',
    description: 'Just start writing with plain text',
    command: (editor: Editor) => editor.chain().focus().setParagraph().run(),
    category: 'basic'
  },
  {
    icon: Heading1,
    title: 'Heading 1',
    description: 'Big section heading',
    command: (editor: Editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    category: 'basic'
  },
  {
    icon: Heading2,
    title: 'Heading 2',
    description: 'Medium section heading',
    command: (editor: Editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    category: 'basic'
  },
  {
    icon: Heading3,
    title: 'Heading 3',
    description: 'Small section heading',
    command: (editor: Editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    category: 'basic'
  },
  
  // Lists
  {
    icon: List,
    title: 'Bullet List',
    description: 'Create a simple bullet list',
    command: (editor: Editor) => editor.chain().focus().toggleBulletList().run(),
    category: 'list'
  },
  {
    icon: ListOrdered,
    title: 'Numbered List',
    description: 'Create a numbered list',
    command: (editor: Editor) => editor.chain().focus().toggleOrderedList().run(),
    category: 'list'
  },
  {
    icon: CheckSquare,
    title: 'To-do List',
    description: 'Track tasks with a checklist',
    command: (editor: Editor) => editor.chain().focus().toggleTaskList().run(),
    category: 'list'
  },
  
  // Special blocks
  {
    icon: Quote,
    title: 'Quote',
    description: 'Capture a quote',
    command: (editor: Editor) => editor.chain().focus().toggleBlockquote().run(),
    category: 'special'
  },
  {
    icon: Code,
    title: 'Code Block',
    description: 'Display code with syntax highlighting',
    command: (editor: Editor) => editor.chain().focus().toggleCodeBlock().run(),
    category: 'special'
  },
  {
    icon: MessageSquare,
    title: 'Callout',
    description: 'Make writing stand out',
    command: (editor: Editor) => {
      editor.chain().focus().insertContent({
        type: 'paragraph',
        content: [{ type: 'text', text: '💡 ' }]
      }).run()
    },
    category: 'special'
  },
  
  // Layout
  {
    icon: Table,
    title: 'Table',
    description: 'Insert a table',
    command: (editor: Editor) => editor.chain().focus().insertTable({ rows: 3, cols: 3 }).run(),
    category: 'layout'
  },
  {
    icon: Minus,
    title: 'Divider',
    description: 'Visually divide blocks',
    command: (editor: Editor) => editor.chain().focus().setHorizontalRule().run(),
    category: 'layout'
  },
  
  // Inline
  {
    icon: Link2,
    title: 'Link',
    description: 'Create a link',
    command: (editor: Editor) => {
      const url = window.prompt('Enter URL:')
      if (url) {
        editor.chain().focus().setLink({ href: url }).run()
      }
    },
    category: 'inline'
  },
  
  // Templates (insert pre-formatted text)
  {
    icon: FileText,
    title: 'Meeting Agenda',
    description: 'Quick meeting agenda template',
    command: (editor: Editor) => {
      editor.chain().focus().insertContent({
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'Meeting Agenda' }]
      }).run()
      editor.chain().focus().insertContent({ type: 'paragraph' }).run()
      editor.chain().focus().insertContent({
        type: 'bulletList',
        content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Opening & introductions' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Main discussion points' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Action items' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Next steps' }] }] },
        ]
      }).run()
    },
    category: 'template'
  },
  {
    icon: Calendar,
    title: 'Date',
    description: 'Insert today\'s date',
    command: (editor: Editor) => {
      const today = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
      editor.chain().focus().insertContent(today).run()
    },
    category: 'inline'
  },
  {
    icon: Clock,
    title: 'Time',
    description: 'Insert current time',
    command: (editor: Editor) => {
      const now = new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
      editor.chain().focus().insertContent(now).run()
    },
    category: 'inline'
  },
]

interface SlashCommandsProps {
  editor: Editor
  position: { top: number; left: number }
  onClose: () => void
  docType?: string
}

export function SlashCommands({ editor, position, onClose, docType }: SlashCommandsProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')

  // Filter commands based on search
  const filteredCommands = searchQuery
    ? SLASH_COMMANDS.filter(cmd =>
        cmd.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cmd.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : SLASH_COMMANDS

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => (i + 1) % filteredCommands.length)
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => (i - 1 + filteredCommands.length) % filteredCommands.length)
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        const command = filteredCommands[selectedIndex]
        if (command) {
          command.command(editor)
          onClose()
        }
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
      // Allow typing to search
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        setSearchQuery(prev => prev + e.key)
      }
      if (e.key === 'Backspace') {
        setSearchQuery(prev => prev.slice(0, -1))
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedIndex, editor, onClose, filteredCommands])

  // Group commands by category
  const categories = {
    basic: filteredCommands.filter(cmd => cmd.category === 'basic'),
    list: filteredCommands.filter(cmd => cmd.category === 'list'),
    special: filteredCommands.filter(cmd => cmd.category === 'special'),
    layout: filteredCommands.filter(cmd => cmd.category === 'layout'),
    inline: filteredCommands.filter(cmd => cmd.category === 'inline'),
    template: filteredCommands.filter(cmd => cmd.category === 'template'),
  }

  const categoryLabels = {
    basic: 'Basic blocks',
    list: 'Lists',
    special: 'Special blocks',
    layout: 'Layout',
    inline: 'Inline',
    template: 'Templates',
  }

  return (
    <Card
      className="slash-commands-menu fixed z-50 w-96 max-h-[500px] overflow-y-auto shadow-xl border-2"
      style={{ 
        top: position.top + 30, 
        left: position.left,
        pointerEvents: 'auto'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="sticky top-0 bg-background border-b px-3 py-2 z-10 flex items-center justify-between">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search commands..."
          className="flex-1 px-2 py-1 text-sm bg-transparent focus:outline-none"
          autoFocus
        />
        <button
          onClick={onClose}
          className="ml-2 p-1 hover:bg-muted rounded"
          title="Close (Esc)"
        >
          ✕
        </button>
      </div>

      <div className="p-2">
        {filteredCommands.length === 0 ? (
          <div className="px-3 py-8 text-center text-sm text-muted-foreground">
            No commands found
          </div>
        ) : searchQuery ? (
          // Show flat list when searching
          filteredCommands.map((cmd, index) => {
            const Icon = cmd.icon
            return (
              <button
                key={cmd.title}
                onClick={() => {
                  cmd.command(editor)
                  onClose()
                }}
                className={cn(
                  'w-full flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left',
                  selectedIndex === index && 'bg-muted'
                )}
              >
                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{cmd.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{cmd.description}</p>
                </div>
              </button>
            )
          })
        ) : (
          // Show grouped by category when not searching
          Object.entries(categories).map(([key, commands]) => {
            if (commands.length === 0) return null
            
            return (
              <div key={key} className="mb-3">
                <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {categoryLabels[key as keyof typeof categoryLabels]}
                </div>
                {commands.map((cmd) => {
                  const Icon = cmd.icon
                  const globalIndex = filteredCommands.indexOf(cmd)
                  
                  return (
                    <button
                      key={cmd.title}
                      onClick={() => {
                        cmd.command(editor)
                        onClose()
                      }}
                      className={cn(
                        'w-full flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left',
                        selectedIndex === globalIndex && 'bg-muted'
                      )}
                    >
                      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{cmd.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{cmd.description}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )
          })
        )}
      </div>

      <div className="sticky bottom-0 bg-background border-t px-3 py-2 text-xs text-muted-foreground">
        ↑↓ to navigate • ↵ to select • Esc to close
      </div>
    </Card>
  )
}