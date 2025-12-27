// ============================================
// FILE: components/documents/EditorToolbar.tsx
// PROFESSIONAL FIX - Working table commands
// ============================================
'use client'

import { Editor } from '@tiptap/react'
import { Button } from '@/components/ui/Button'
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Table,
  Highlighter,
  CheckSquare,
  CodeSquare,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/Dropdown'
import { toast } from 'sonner'

interface EditorToolbarProps {
  editor: Editor
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) {
    return null
  }

  const insertTable = () => {
    try {
      editor
        .chain()
        .focus()
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run()
      toast.success('Table inserted')
    } catch (error) {
      toast.error('Failed to insert table')
      console.error('Table insertion error:', error)
    }
  }

  const addColumnBefore = () => {
    try {
      editor.chain().focus().addColumnBefore().run()
      toast.success('Column added')
    } catch (error) {
      toast.error('Failed to add column')
    }
  }

  const addColumnAfter = () => {
    try {
      editor.chain().focus().addColumnAfter().run()
      toast.success('Column added')
    } catch (error) {
      toast.error('Failed to add column')
    }
  }

  const deleteColumn = () => {
    try {
      editor.chain().focus().deleteColumn().run()
      toast.success('Column deleted')
    } catch (error) {
      toast.error('Failed to delete column')
    }
  }

  const addRowBefore = () => {
    try {
      editor.chain().focus().addRowBefore().run()
      toast.success('Row added')
    } catch (error) {
      toast.error('Failed to add row')
    }
  }

  const addRowAfter = () => {
    try {
      editor.chain().focus().addRowAfter().run()
      toast.success('Row added')
    } catch (error) {
      toast.error('Failed to add row')
    }
  }

  const deleteRow = () => {
    try {
      editor.chain().focus().deleteRow().run()
      toast.success('Row deleted')
    } catch (error) {
      toast.error('Failed to delete row')
    }
  }

  const deleteTable = () => {
    try {
      editor.chain().focus().deleteTable().run()
      toast.success('Table deleted')
    } catch (error) {
      toast.error('Failed to delete table')
    }
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)

    if (url === null) {
      return
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  const isActive = (name: string, attrs?: any) => {
    return editor.isActive(name, attrs)
  }

  const canUndo = () => {
    return editor.can().chain().focus().undo().run()
  }

  const canRedo = () => {
    return editor.can().chain().focus().redo().run()
  }

  return (
    <div className="border-b bg-muted/50 sticky top-0 z-10">
      <div className="flex items-center gap-1 p-2 flex-wrap">
        {/* Undo/Redo */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!canUndo()}
          title="Undo"
          className="h-8 w-8 p-0"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!canRedo()}
          title="Redo"
          className="h-8 w-8 p-0"
        >
          <Redo className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Text Formatting */}
        <Button
          variant={isActive('bold') ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
          className="h-8 w-8 p-0"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant={isActive('italic') ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
          className="h-8 w-8 p-0"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant={isActive('strike') ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Strikethrough"
          className="h-8 w-8 p-0"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        <Button
          variant={isActive('code') ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleCode().run()}
          title="Inline Code"
          className="h-8 w-8 p-0"
        >
          <Code className="h-4 w-4" />
        </Button>
        <Button
          variant={isActive('highlight') ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          title="Highlight"
          className="h-8 w-8 p-0"
        >
          <Highlighter className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Headings */}
        <Button
          variant={isActive('heading', { level: 1 }) ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title="Heading 1"
          className="h-8 w-8 p-0"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          variant={isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Heading 2"
          className="h-8 w-8 p-0"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          variant={isActive('heading', { level: 3 }) ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Heading 3"
          className="h-8 w-8 p-0"
        >
          <Heading3 className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Lists */}
        <Button
          variant={isActive('bulletList') ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet List"
          className="h-8 w-8 p-0"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant={isActive('orderedList') ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered List"
          className="h-8 w-8 p-0"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          variant={isActive('taskList') ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          title="Task List"
          className="h-8 w-8 p-0"
        >
          <CheckSquare className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Other */}
        <Button
          variant={isActive('blockquote') ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Quote"
          className="h-8 w-8 p-0"
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Button
          variant={isActive('codeBlock') ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          title="Code Block"
          className="h-8 w-8 p-0"
        >
          <CodeSquare className="h-4 w-4" />
        </Button>
        <Button
          variant={isActive('link') ? 'secondary' : 'ghost'}
          size="sm"
          onClick={setLink}
          title="Link"
          className="h-8 w-8 p-0"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>

        {/* Table Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={isActive('table') ? 'secondary' : 'ghost'}
              size="sm"
              title="Table"
              className="h-8 w-8 p-0"
            >
              <Table className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={insertTable}>
              Insert Table (3x3)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={addColumnBefore} disabled={!isActive('table')}>
              Add Column Before
            </DropdownMenuItem>
            <DropdownMenuItem onClick={addColumnAfter} disabled={!isActive('table')}>
              Add Column After
            </DropdownMenuItem>
            <DropdownMenuItem onClick={deleteColumn} disabled={!isActive('table')}>
              Delete Column
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={addRowBefore} disabled={!isActive('table')}>
              Add Row Before
            </DropdownMenuItem>
            <DropdownMenuItem onClick={addRowAfter} disabled={!isActive('table')}>
              Add Row After
            </DropdownMenuItem>
            <DropdownMenuItem onClick={deleteRow} disabled={!isActive('table')}>
              Delete Row
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={deleteTable} disabled={!isActive('table')} className="text-destructive">
              Delete Table
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}