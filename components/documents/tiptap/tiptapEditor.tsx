// ============================================
// FILE: components/documents/TiptapEditor.tsx
// FIXED - Tables and lists now visible
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
import { generateHeadingId } from '@/lib/utils/heading-id'

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
      
      setTimeout(() => {
        const { state } = editor
        const { doc } = state
        
        doc.descendants((node, pos) => {
          if (node.type.name === 'heading') {
            const id = generateHeadingId(node.textContent, pos)
            const dom = editor.view.nodeDOM(pos) as HTMLElement
            if (dom) {
              dom.id = id
              dom.setAttribute('data-heading-id', id)
            }
          }
        })
      }, 50)
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
          const id = generateHeadingId(node.textContent, pos)
          const dom = editor.view.nodeDOM(pos) as HTMLElement
          if (dom) {
            dom.id = id
            dom.setAttribute('data-heading-id', id)
          }
        }
      })
    }

    updateHeadingIds()
    const timeout = setTimeout(updateHeadingIds, 100)
    return () => clearTimeout(timeout)
  }, [editor])

  useEffect(() => {
    if (!editor) return

    const extractAndNotify = () => {
      const headings = extractHeadings(editor)
      const json = editor.getJSON()
      onChange(json, headings)
    }

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
        /* Base Editor Styles */
        .prose-editor {
          min-height: 60vh;
          padding: 3rem 2rem;
          outline: none;
        }

        /* Headings */
        .prose-editor h1 {
          font-size: 2.5rem;
          font-weight: 600;
          margin: 2rem 0 0.75rem;
          line-height: 1.2;
        }

        .prose-editor h2 {
          font-size: 1.875rem;
          font-weight: 600;
          margin: 1.5rem 0 0.75rem;
          line-height: 1.3;
        }

        .prose-editor h3 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 1.25rem 0 0.75rem;
          line-height: 1.4;
        }

        /* Paragraphs */
        .prose-editor p {
          margin: 0.75rem 0;
          line-height: 1.7;
        }

        /* LISTS - FIXED */
        .prose-editor ul:not([data-type="taskList"]) {
          list-style-type: disc;
          list-style-position: outside;
          padding-left: 1.5rem;
          margin: 1rem 0 1rem 0.5rem;
        }

        .prose-editor ol {
          list-style-type: decimal;
          list-style-position: outside;
          padding-left: 1.5rem;
          margin: 1rem 0 1rem 0.5rem;
        }

        .prose-editor ul:not([data-type="taskList"]) li,
        .prose-editor ol li {
          margin: 0.5rem 0;
          padding-left: 0.5rem;
          display: list-item;
        }

        .prose-editor ul ul,
        .prose-editor ol ul {
          list-style-type: circle;
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }

        .prose-editor ul ul ul,
        .prose-editor ol ul ul {
          list-style-type: square;
        }

        .prose-editor ol ol {
          list-style-type: lower-alpha;
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }

        /* Code */
        .prose-editor code {
          background: hsl(var(--muted));
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-size: 0.875em;
          font-family: 'Courier New', monospace;
        }

        .prose-editor pre {
          background: hsl(var(--muted));
          padding: 1rem;
          border-radius: 0.5rem;
          margin: 1.5rem 0;
          overflow-x: auto;
        }

        .prose-editor pre code {
          background: none;
          padding: 0;
          font-size: 0.875rem;
        }

        /* Blockquote */
        .prose-editor blockquote {
          border-left: 4px solid hsl(var(--primary));
          padding-left: 1rem;
          margin: 1.5rem 0;
          font-style: italic;
          color: hsl(var(--muted-foreground));
        }

        /* TABLES - PROPER STYLING (NO MORE CIRCUS COLORS!) */
        .prose-editor .tableWrapper {
          overflow-x: auto;
          margin: 1.5rem 0;
          width: 100%;
        }

        .prose-editor table,
        .prose-editor .tableWrapper table,
        .ProseMirror table {
          display: table !important;
          border-collapse: separate !important;
          border-spacing: 0 !important;
          table-layout: auto !important;
          width: 100% !important;
          min-width: 100% !important;
          max-width: 100% !important;
          margin: 0 !important;
          overflow: visible !important;
          border: 1px solid #d1d5db !important;
          background: transparent !important;
        }

        .prose-editor colgroup,
        .prose-editor .tableWrapper colgroup {
          display: table-column-group !important;
        }

        .prose-editor col,
        .prose-editor .tableWrapper col {
          display: table-column !important;
        }

        .prose-editor tbody,
        .prose-editor .tableWrapper tbody {
          display: table-row-group !important;
        }

        .prose-editor thead,
        .prose-editor .tableWrapper thead {
          display: table-header-group !important;
        }

        .prose-editor tr,
        .prose-editor .tableWrapper tr {
          display: table-row !important;
        }

        .prose-editor table *,
        .prose-editor .tableWrapper table * {
          box-sizing: border-box !important;
        }

        .prose-editor td,
        .prose-editor th,
        .prose-editor .tableWrapper td,
        .prose-editor .tableWrapper th,
        .ProseMirror td,
        .ProseMirror th {
          display: table-cell !important;
          min-width: 150px !important;
          min-height: 40px !important;
          width: auto !important;
          border: 1px solid #d1d5db !important;
          border-style: solid !important;
          border-width: 1px !important;
          border-color: #d1d5db !important;
          padding: 0.75rem !important;
          vertical-align: top !important;
          box-sizing: border-box !important;
          position: relative !important;
          text-align: left !important;
          background: transparent !important;
        }

        .prose-editor th,
        .prose-editor .tableWrapper th,
        .ProseMirror th {
          background: #f9fafb !important;
          font-weight: 600 !important;
          text-align: left !important;
        }

        .prose-editor td p,
        .prose-editor th p,
        .prose-editor .tableWrapper td p,
        .prose-editor .tableWrapper th p {
          margin: 0 !important;
        }

        /* Hover effect for better UX */
        .prose-editor td:hover,
        .prose-editor th:hover {
          background: #f3f4f6 !important;
        }

        /* Selected cell highlight */
        .prose-editor .selectedCell:after {
          z-index: 2;
          position: absolute;
          content: "";
          left: 0;
          right: 0;
          top: 0;
          bottom: 0;
          background: rgba(59, 130, 246, 0.1);
          pointer-events: none;
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .prose-editor table,
          .prose-editor td,
          .prose-editor th {
            border-color: #374151 !important;
          }
          
          .prose-editor th {
            background: #1f2937 !important;
          }
          
          .prose-editor td:hover,
          .prose-editor th:hover {
            background: #111827 !important;
          }
        }

        /* Empty table placeholder */
        .prose-editor .tableWrapper.is-empty::before {
          content: attr(data-placeholder);
          position: absolute;
          color: #9ca3af;
          pointer-events: none;
          opacity: 0.5;
        }

        /* Table resize handle */
        .prose-editor .column-resize-handle {
          position: absolute;
          right: -2px;
          top: 0;
          bottom: 0;
          width: 4px;
          background-color: hsl(var(--primary));
          pointer-events: none;
        }

        .prose-editor .tableWrapper {
          overflow-x: auto;
          margin: 1.5rem 0;
        }

        /* Selected cell/row highlighting */
        .prose-editor .selectedCell:after {
          z-index: 2;
          position: absolute;
          content: "";
          left: 0;
          right: 0;
          top: 0;
          bottom: 0;
          background: hsl(var(--primary) / 0.1);
          pointer-events: none;
        }

        /* Task Lists */
        .prose-editor ul[data-type="taskList"] {
          list-style: none;
          padding-left: 0;
          margin: 1rem 0;
        }

        .prose-editor ul[data-type="taskList"] li {
          display: flex;
          gap: 0.5rem;
          align-items: flex-start;
          margin: 0.5rem 0;
        }

        .prose-editor ul[data-type="taskList"] li > label {
          flex: 0 0 auto;
          margin-right: 0.5rem;
          user-select: none;
          display: flex;
          align-items: center;
          padding-top: 0.15rem;
        }

        .prose-editor ul[data-type="taskList"] li > div {
          flex: 1 1 auto;
        }

        .prose-editor ul[data-type="taskList"] input[type="checkbox"] {
          cursor: pointer;
          width: 1rem;
          height: 1rem;
          margin: 0;
          flex-shrink: 0;
        }

        .prose-editor ul[data-type="taskList"] p {
          margin: 0;
        }

        /* Highlight */
        .prose-editor mark {
          background: hsl(var(--primary) / 0.2);
          padding: 0.1rem 0.2rem;
          border-radius: 0.25rem;
        }

        /* Links */
        .prose-editor a {
          color: hsl(var(--primary));
          text-decoration: underline;
          cursor: pointer;
        }

        .prose-editor a:hover {
          opacity: 0.8;
        }

        /* Selection */
        .prose-editor .ProseMirror-selectednode {
          outline: 2px solid hsl(var(--primary));
        }

        /* Placeholder */
        .prose-editor .ProseMirror p.is-editor-empty:first-child::before {
          color: hsl(var(--muted-foreground));
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
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
      const id = generateHeadingId(node.textContent, pos)
      
      headings.push({
        id,
        level: node.attrs.level,
        text: node.textContent,
        pos,
      })
    }
  })

  return headings
}