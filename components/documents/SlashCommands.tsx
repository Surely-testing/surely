// ============================================
// FILE: components/documents/SlashCommands.tsx
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
} from 'lucide-react'
import { cn } from '@/lib/utils'

const SLASH_COMMANDS = [
  {
    icon: Heading1,
    title: 'Heading 1',
    description: 'Big section heading',
    command: (editor: Editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    icon: Heading2,
    title: 'Heading 2',
    description: 'Medium section heading',
    command: (editor: Editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    icon: Heading3,
    title: 'Heading 3',
    description: 'Small section heading',
    command: (editor: Editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    icon: List,
    title: 'Bullet List',
    description: 'Create a simple bullet list',
    command: (editor: Editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    icon: ListOrdered,
    title: 'Numbered List',
    description: 'Create a numbered list',
    command: (editor: Editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    icon: CheckSquare,
    title: 'To-do List',
    description: 'Track tasks with a checklist',
    command: (editor: Editor) => editor.chain().focus().toggleTaskList().run(),
  },
  {
    icon: Quote,
    title: 'Quote',
    description: 'Capture a quote',
    command: (editor: Editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    icon: Code,
    title: 'Code Block',
    description: 'Display code with syntax highlighting',
    command: (editor: Editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    icon: Table,
    title: 'Table',
    description: 'Insert a table',
    command: (editor: Editor) => editor.chain().focus().insertTable({ rows: 3, cols: 3 }).run(),
  },
  {
    icon: Minus,
    title: 'Divider',
    description: 'Visually divide blocks',
    command: (editor: Editor) => editor.chain().focus().setHorizontalRule().run(),
  },
]

interface SlashCommandsProps {
  editor: Editor
  position: { top: number; left: number }
  onClose: () => void
}

export function SlashCommands({ editor, position, onClose }: SlashCommandsProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => (i + 1) % SLASH_COMMANDS.length)
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => (i - 1 + SLASH_COMMANDS.length) % SLASH_COMMANDS.length)
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        const command = SLASH_COMMANDS[selectedIndex]
        command.command(editor)
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedIndex, editor, onClose])

  return (
    <Card
      className="fixed z-50 w-80 max-h-96 overflow-y-auto shadow-xl"
      style={{ top: position.top + 30, left: position.left }}
    >
      <div className="p-2">
        {SLASH_COMMANDS.map((cmd, index) => {
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
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{cmd.title}</p>
                <p className="text-xs text-muted-foreground truncate">{cmd.description}</p>
              </div>
            </button>
          )
        })}
      </div>
    </Card>
  )
}