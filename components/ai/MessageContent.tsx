// components/ai/MessageContent.tsx
'use client'

import React from 'react'

interface MessageContentProps {
  content: string
  className?: string
}

export function MessageContent({ content, className = '' }: MessageContentProps) {
  // Convert markdown-style formatting to HTML
  const formatContent = (text: string): string => {
    return text
      // Bold: **text** or __text__
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.+?)__/g, '<strong>$1</strong>')
      
      // Italic: *text* or _text_ (but not **, __, or numbers like 1.)
      .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
      .replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, '<em>$1</em>')
      
      // Code: `code`
      .replace(/`(.+?)`/g, '<code class="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">$1</code>')
      
      // Headers: # Header (convert to just bold for inline display)
      .replace(/^#{1,6}\s+(.+)$/gm, '<strong>$1</strong>')
      
      // Preserve line breaks
      .replace(/\n/g, '<br />')
      
      // Lists: convert - or * at start of line to bullet
      .replace(/^[\*\-]\s+(.+)$/gm, '• $1')
      
      // Numbered lists: keep as is
      .replace(/^(\d+)\.\s+(.+)$/gm, '$1. $2')
  }

  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: formatContent(content) }}
    />
  )
}