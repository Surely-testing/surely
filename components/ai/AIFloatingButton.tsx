// ============================================
// FILE: components/ai/AIFloatingButton.tsx
// ============================================
'use client'

import React from 'react'
import { Sparkles } from 'lucide-react'
import { useAI } from './AIAssistantProvider'

export function AIFloatingButton() {
  const { isOpen, setIsOpen, suggestions } = useAI()

  // Show button when chat is closed
  if (isOpen) return null

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 rounded-full shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 flex items-center justify-center group z-[9999] hover:scale-110"
        style={{ zIndex: 9999 }}
      >
        <Sparkles className="h-7 w-7 text-white group-hover:rotate-12 transition-transform" />
        
        {/* Notification Badge */}
        {suggestions.length > 0 && (
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse">
            {suggestions.length}
          </div>
        )}
        
        {/* Pulse Animation */}
        <div className="absolute inset-0 rounded-full bg-purple-600 animate-ping opacity-20"></div>
      </button>
    </>
  )
}