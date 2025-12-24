// ============================================
// FILE: components/documents/TiptapEditor.tsx
// Adding back extensions step by step
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
import { getDocTypePlaceholder, type DocType } from '@/lib/utils/document-templates'

const lowlight = createLowlight(common)

interface TiptapEditorProps {
  initialContent: any
  onChange: (content: any, headings: any[]) => void
  onTextSelect?: (text: string, range: any, editor: any) => void
  docType?: DocType
}

export function TiptapEditor({ 
  initialContent, 
  onChange, 
  onTextSelect,
  docType = 'general' 
}: TiptapEditorProps) {
  const [showSlashMenu, setShowSlashMenu] = useState(false)
  const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 })

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return 'Heading'
          }
          return getDocTypePlaceholder(docType)
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
      }),
      Highlight,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'prose-editor',
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
      
      // Update heading IDs after content changes
      setTimeout(() => {
        const { state } = editor
        const { doc } = state
        
        doc.descendants((node, pos) => {
          if (node.type.name === 'heading') {
            const text = node.textContent
            // Use same ID generation logic
            const id = text
              ? `heading-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 50)}`
              : `heading-${pos}`
            const dom = editor.view.nodeDOM(pos) as HTMLElement
            if (dom) {
              dom.id = id
            }
          }
        })
      }, 0)
    },
    onSelectionUpdate: ({ editor }) => {
      if (!onTextSelect) return
      
      const { from, to } = editor.state.selection
      const text = editor.state.doc.textBetween(from, to, ' ')
      
      if (text && text.trim().length > 0) {
        onTextSelect(text, { from, to }, editor)
      }
    },
  })

  useEffect(() => {
    if (!editor) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.slash-commands-menu')) {
        setShowSlashMenu(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [editor])

  useEffect(() => {
    if (!editor) return

    const updateHeadingIds = () => {
      const { state } = editor
      const { doc } = state
      
      doc.descendants((node, pos) => {
        if (node.type.name === 'heading') {
          const text = node.textContent
          // Use same ID generation logic as extractHeadings
          const id = text
            ? `heading-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 50)}`
            : `heading-${pos}`
          const dom = editor.view.nodeDOM(pos) as HTMLElement
          if (dom) {
            dom.id = id
          }
        }
      })
    }

    updateHeadingIds()
  }, [editor])

  // Extract headings on initial load and when content changes
  useEffect(() => {
    if (!editor) return

    // Extract headings immediately
    const extractAndNotify = () => {
      const headings = extractHeadings(editor)
      const json = editor.getJSON()
      onChange(json, headings)
    }

    // Run once on mount
    extractAndNotify()
  }, [editor])

  if (!editor) {
    return <div className="p-8">Loading editor...</div>
  }

  return (
    <div className="relative w-full">
      <EditorToolbar editor={editor} />
      
      <div className="mt-4">
        <EditorContent editor={editor} />
      </div>

      {showSlashMenu && (
        <SlashCommands
          editor={editor}
          position={slashMenuPosition}
          onClose={() => setShowSlashMenu(false)}
          docType={docType}
        />
      )}

      <style jsx global>{`
        .prose-editor {
          min-height: 60vh;
          padding: 3rem 2rem;
          outline: none;
        }

        .prose-editor h1 {
          font-size: 2.5rem;
          font-weight: 600;
          margin: 2rem 0 0.75rem;
        }

        .prose-editor h2 {
          font-size: 1.875rem;
          font-weight: 600;
          margin: 1.5rem 0 0.75rem;
        }

        .prose-editor h3 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 1.25rem 0 0.75rem;
        }

        .prose-editor p {
          margin: 0.75rem 0;
          line-height: 1.7;
        }

        .prose-editor ul,
        .prose-editor ol {
          padding-left: 2rem;
          margin: 1rem 0;
        }

        .prose-editor li {
          margin: 0.5rem 0;
        }

        .prose-editor code {
          background: hsl(var(--muted));
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-size: 0.875em;
        }

        .prose-editor pre {
          background: hsl(var(--muted));
          padding: 1rem;
          border-radius: 0.5rem;
          margin: 1.5rem 0;
          overflow-x: auto;
        }

        .prose-editor blockquote {
          border-left: 4px solid hsl(var(--primary));
          padding-left: 1rem;
          margin: 1.5rem 0;
          font-style: italic;
          color: hsl(var(--muted-foreground));
        }

        .prose-editor table {
          border-collapse: collapse;
          width: 100%;
          margin: 1.5rem 0;
        }

        .prose-editor th,
        .prose-editor td {
          border: 1px solid hsl(var(--border));
          padding: 0.75rem;
        }

        .prose-editor th {
          background: hsl(var(--muted));
          font-weight: 600;
        }

        .prose-editor ul[data-type="taskList"] {
          list-style: none;
          padding-left: 0;
        }

        .prose-editor ul[data-type="taskList"] li {
          display: flex;
          gap: 0.5rem;
        }

        .prose-editor ul[data-type="taskList"] input {
          margin-top: 0.35rem;
          cursor: pointer;
        }

        .prose-editor mark {
          background: hsl(var(--primary) / 0.2);
          padding: 0.1rem 0.2rem;
          border-radius: 0.25rem;
        }

        .prose-editor a {
          color: hsl(var(--primary));
          text-decoration: underline;
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
      const text = node.textContent
      // Create stable ID from text content
      const id = text
        ? `heading-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 50)}`
        : `heading-${pos}`
      
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