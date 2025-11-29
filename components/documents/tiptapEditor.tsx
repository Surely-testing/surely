// ============================================
// FILE: components/documents/TiptapEditor.tsx
// ============================================
'use client'

import { useEffect, useState } from 'react'
import { useEditor, EditorContent, Editor } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { Placeholder } from '@tiptap/extension-placeholder'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { Link } from '@tiptap/extension-link'
import { Highlight } from '@tiptap/extension-highlight'
import { TaskList } from '@tiptap/extension-task-list'
import { TaskItem } from '@tiptap/extension-task-item'
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import { EditorToolbar } from './EditorToolbar'
import { SlashCommands } from './SlashCommands'

const lowlight = createLowlight(common)

interface TiptapEditorProps {
  initialContent: any
  onChange: (content: any, headings: any[]) => void
}

export function TiptapEditor({ initialContent, onChange }: TiptapEditorProps) {
  const [showSlashMenu, setShowSlashMenu] = useState(false)
  const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 })

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: {
          levels: [1, 2, 3],
          HTMLAttributes: {
            class: 'editor-heading',
          },
        },
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return 'Heading'
          }
          return "Type '/' for commands..."
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
      Highlight.configure({
        HTMLAttributes: {
          class: 'bg-yellow-200 dark:bg-yellow-800',
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'task-item',
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'code-block',
        },
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'notion-editor focus:outline-none',
      },
      handleKeyDown: (view, event) => {
        if (event.key === '/') {
          setTimeout(() => {
            const { state } = view
            const { selection } = state
            const coords = view.coordsAtPos(selection.$anchor.pos)
            setSlashMenuPosition({ top: coords.top, left: coords.left })
            setShowSlashMenu(true)
          }, 0)
        }
        if (event.key === 'Escape') {
          setShowSlashMenu(false)
        }
        return false
      },
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON()
      const headings = extractHeadings(editor)
      onChange(json, headings)
    },
  })

  useEffect(() => {
    if (!editor) return

    const handleClickOutside = () => setShowSlashMenu(false)
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [editor])

  // Add IDs to headings for navigation
  useEffect(() => {
    if (!editor) return

    const updateHeadingIds = () => {
      const { state } = editor
      const { doc } = state
      
      doc.descendants((node, pos) => {
        if (node.type.name === 'heading') {
          const id = `heading-${pos}`
          const dom = editor.view.nodeDOM(pos) as HTMLElement
          if (dom) {
            dom.id = id
          }
        }
      })
    }

    updateHeadingIds()
  }, [editor])

  if (!editor) {
    return (
      <div className="animate-pulse space-y-4 px-8 py-6">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-5/6" />
        <div className="h-4 bg-muted rounded w-4/6" />
      </div>
    )
  }

  return (
    <div className="relative w-full max-w-full">
      <EditorToolbar editor={editor} />
      
      <div className="mt-4 w-full">
        <EditorContent editor={editor} />
      </div>

      {showSlashMenu && (
        <SlashCommands
          editor={editor}
          position={slashMenuPosition}
          onClose={() => setShowSlashMenu(false)}
        />
      )}

      <style jsx global>{`
        .notion-editor {
          min-height: 70vh;
          padding: 3rem 8rem;
          font-size: 16px;
          line-height: 1.7;
          color: var(--foreground);
        }

        .notion-editor .ProseMirror-focused {
          outline: none;
        }

        /* Headings with drag handles */
        .notion-editor h1,
        .notion-editor h2,
        .notion-editor h3 {
          position: relative;
          scroll-margin-top: 100px;
          margin-top: 2rem;
          margin-bottom: 0.5rem;
          font-weight: 600;
          line-height: 1.3;
        }

        .notion-editor h1 {
          font-size: 2.5rem;
          margin-top: 2.5rem;
        }

        .notion-editor h2 {
          font-size: 1.875rem;
          margin-top: 2rem;
        }

        .notion-editor h3 {
          font-size: 1.5rem;
          margin-top: 1.5rem;
        }

        /* Drag Handle */
        .notion-editor h1:hover::before,
        .notion-editor h2:hover::before,
        .notion-editor h3:hover::before,
        .notion-editor p:hover::before,
        .notion-editor ul:hover::before,
        .notion-editor ol:hover::before {
          content: '⋮⋮';
          position: absolute;
          left: -2rem;
          color: var(--muted-foreground);
          cursor: grab;
          opacity: 0.5;
          font-size: 1rem;
          padding: 0.25rem;
        }

        .notion-editor h1:hover::before,
        .notion-editor h2:hover::before,
        .notion-editor h3:hover::before {
          top: 0.25rem;
        }

        .notion-editor p {
          margin: 0.5rem 0;
          min-height: 1.5rem;
        }

        .notion-editor p:empty::before {
          content: attr(data-placeholder);
          color: var(--muted-foreground);
          pointer-events: none;
        }

        .notion-editor ul,
        .notion-editor ol {
          padding-left: 2rem;
          margin: 1rem 0;
        }

        .notion-editor li {
          margin: 0.25rem 0;
          position: relative;
        }

        .notion-editor code {
          background-color: hsl(var(--muted));
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-size: 0.875em;
          font-family: 'Courier New', monospace;
        }

        .notion-editor pre {
          background-color: hsl(var(--muted));
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1rem 0;
          border: 1px solid hsl(var(--border));
        }

        .notion-editor pre code {
          background: none;
          padding: 0;
          font-size: 0.875rem;
        }

        .notion-editor blockquote {
          border-left: 4px solid hsl(var(--primary));
          padding-left: 1rem;
          margin: 1rem 0;
          color: hsl(var(--muted-foreground));
        }

        .notion-editor hr {
          border: none;
          border-top: 1px solid hsl(var(--border));
          margin: 2rem 0;
        }

        .notion-editor table {
          border-collapse: collapse;
          width: 100%;
          margin: 1rem 0;
          border: 1px solid hsl(var(--border));
        }

        .notion-editor th,
        .notion-editor td {
          border: 1px solid hsl(var(--border));
          padding: 0.75rem;
          text-align: left;
          min-width: 100px;
        }

        .notion-editor th {
          background-color: hsl(var(--muted));
          font-weight: 600;
        }

        /* Task Lists */
        .notion-editor ul[data-type="taskList"] {
          list-style: none;
          padding-left: 0;
        }

        .notion-editor ul[data-type="taskList"] li {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
        }

        .notion-editor ul[data-type="taskList"] input[type="checkbox"] {
          margin-top: 0.35rem;
          cursor: pointer;
          width: 1rem;
          height: 1rem;
        }

        .notion-editor mark {
          background-color: hsl(var(--primary) / 0.2);
          padding: 0.1rem 0.2rem;
          border-radius: 0.25rem;
        }

        /* Empty state */
        .notion-editor .is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: hsl(var(--muted-foreground));
          pointer-events: none;
          height: 0;
        }

        @media (max-width: 1024px) {
          .notion-editor {
            padding: 2rem 4rem;
          }
        }

        @media (max-width: 768px) {
          .notion-editor {
            padding: 1rem 2rem;
          }
        }
      `}</style>
    </div>
  )
}

function extractHeadings(editor: Editor): any[] {
  const headings: any[] = []
  const { state } = editor
  const { doc } = state

  doc.descendants((node, pos) => {
    if (node.type.name === 'heading') {
      const id = `heading-${pos}`
      const text = node.textContent
      headings.push({
        id,
        level: node.attrs.level,
        text,
        pos,
      })
    }
  })

  return headings
}