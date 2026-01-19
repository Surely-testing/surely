// ============================================
// FILE: components/ai/AIFloatingButton.tsx
// ============================================
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useAI } from './AIAssistantProvider'

export function AIFloatingButton() {
  const { isOpen, setIsOpen, suggestions, robotPosition, setRobotPosition } = useAI()
  const [isBlinking, setIsBlinking] = useState(false)
  const [expression, setExpression] = useState<'neutral' | 'happy' | 'excited' | 'thinking'>('neutral')
  const [isDragging, setIsDragging] = useState(false)
  const [hasDragged, setHasDragged] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const dragThreshold = 5
  const buttonRef = useRef<HTMLDivElement>(null)

  // Random blinking
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true)
      setTimeout(() => setIsBlinking(false), 150)
    }, Math.random() * 5000 + 3000)
    return () => clearInterval(blinkInterval)
  }, [])

  // Expression changes based on state
  useEffect(() => {
    if (suggestions.length > 0) {
      setExpression('excited')
    } else {
      // Random expressions when idle
      const expressionInterval = setInterval(() => {
        const expressions: Array<'neutral' | 'happy' | 'thinking'> = ['neutral', 'happy', 'thinking', 'neutral', 'neutral']
        const randomExpression = expressions[Math.floor(Math.random() * expressions.length)]
        setExpression(randomExpression)
      }, Math.random() * 8000 + 5000)
      
      return () => clearInterval(expressionInterval)
    }
  }, [suggestions.length])

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setHasDragged(false)
    setDragStart({ x: e.clientX, y: e.clientY })
    e.preventDefault()
  }

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = Math.abs(e.clientX - dragStart.x)
      const deltaY = Math.abs(e.clientY - dragStart.y)
      
      if (deltaX > dragThreshold || deltaY > dragThreshold) {
        setHasDragged(true)
        
        const newX = e.clientX - 40
        const newY = e.clientY - 40
        
        const maxX = window.innerWidth - 80
        const maxY = window.innerHeight - 80
        
        const boundedX = Math.max(10, Math.min(newX, maxX))
        const boundedY = Math.max(10, Math.min(newY, maxY))
        
        setRobotPosition({ x: boundedX, y: boundedY })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragStart, setRobotPosition])

  if (isOpen) return null

  const hasTips = suggestions.length > 0

  const handleClick = () => {
    if (!hasDragged) {
      setIsOpen(true)
    }
    setTimeout(() => setHasDragged(false), 100)
  }

  // Eye shapes based on expression
  const getEyeHeight = () => {
    if (isBlinking) return 1
    if (expression === 'excited') return 8
    if (expression === 'happy') return 7
    return 6
  }

  // Mouth shapes based on expression - ADJUSTED FOR WIDER FACE
  const getMouthPath = () => {
    switch(expression) {
      case 'excited':
        return 'M 26 50 Q 40 56, 54 50' // Big smile - lower and wider
      case 'happy':
        return 'M 28 50 Q 40 54, 52 50' // Smile - lower
      case 'thinking':
        return 'M 30 50 L 50 50' // Straight line - lower
      default:
        return 'M 30 50 Q 40 52, 50 50' // Slight smile - lower
    }
  }

  return (
    <div 
      ref={buttonRef}
      className="fixed z-[9999] flex flex-col items-center gap-3"
      style={{ 
        left: `${robotPosition.x}px`, 
        top: `${robotPosition.y}px`,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
    >
      {/* Tip Bubble */}
      {hasTips && (
        <div className="bg-white rounded-xl shadow-lg px-4 py-2.5 border border-gray-200 animate-fade-in">
          <p className="text-xs font-medium text-gray-700">
            💡 {suggestions.length} tip{suggestions.length > 1 ? 's' : ''}
          </p>
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-gray-200 transform rotate-45"></div>
        </div>
      )}

      {/* Expressive Robot Head */}
      <div
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        onMouseEnter={() => setExpression('happy')}
        onMouseLeave={() => setExpression('neutral')}
        className={`select-none hover:scale-110 transition-all duration-300 ${
          isDragging ? 'cursor-grabbing scale-110' : 'cursor-grab'
        } ${expression === 'excited' ? 'animate-wiggle' : ''}`}
      >
        <svg
          width="80"
          height="80"
          viewBox="0 0 80 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="headGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#F0F4F8" />
              <stop offset="100%" stopColor="#E2E8F0" />
            </linearGradient>
            <radialGradient id="faceGrad">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#0F172A" />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <filter id="softShadow">
              <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
              <feOffset dx="0" dy="2" result="offsetblur"/>
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.2"/>
              </feComponentTransfer>
              <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Soft shadow */}
          <ellipse cx="40" cy="75" rx="25" ry="4" fill="#1E293B" opacity="0.15" />

          {/* Main head - large prominent sphere */}
          <circle cx="40" cy="40" r="32" fill="url(#headGrad)" filter="url(#softShadow)" />
          
          {/* Ear details - subtle rounded shapes */}
          <circle cx="10" cy="40" r="8" fill="#CBD5E1" opacity="0.4" />
          <circle cx="10" cy="40" r="5" fill="#94A3B8" opacity="0.3" />
          
          <circle cx="70" cy="40" r="8" fill="#CBD5E1" opacity="0.4" />
          <circle cx="70" cy="40" r="5" fill="#94A3B8" opacity="0.3" />

          {/* Face screen - MUCH WIDER dark rounded rectangle */}
          <rect x="12" y="20" width="56" height="40" rx="16" fill="url(#faceGrad)" />
          
          {/* Eyes - expressive with glow - REPOSITIONED */}
          <g className="transition-all duration-300">
            {/* Left eye */}
            <ellipse 
              cx="28" 
              cy="35" 
              rx="6" 
              ry={getEyeHeight()} 
              fill="#22D3EE"
              filter="url(#glow)"
              className="transition-all duration-200"
            />
            <ellipse 
              cx="28" 
              cy={isBlinking ? "35" : "33"} 
              rx="3.5" 
              ry={isBlinking ? "0.5" : getEyeHeight() * 0.6} 
              fill="#67E8F9" 
              opacity={isBlinking ? "0" : "0.9"}
              className="transition-all duration-200"
            />
            
            {/* Right eye */}
            <ellipse 
              cx="52" 
              cy="35" 
              rx="6" 
              ry={getEyeHeight()} 
              fill="#22D3EE"
              filter="url(#glow)"
              className="transition-all duration-200"
            />
            <ellipse 
              cx="52" 
              cy={isBlinking ? "35" : "33"} 
              rx="3.5" 
              ry={isBlinking ? "0.5" : getEyeHeight() * 0.6} 
              fill="#67E8F9" 
              opacity={isBlinking ? "0" : "0.9"}
              className="transition-all duration-200"
            />

            {/* Eyebrows - only show when thinking */}
            {expression === 'thinking' && (
              <>
                <path d="M 20 26 Q 28 24, 36 26" stroke="#22D3EE" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
                <path d="M 44 26 Q 52 24, 60 26" stroke="#22D3EE" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
              </>
            )}

            {/* Sparkle effect when excited */}
            {expression === 'excited' && (
              <>
                <circle cx="22" cy="30" r="2" fill="#67E8F9" opacity="0.8" className="animate-pulse" />
                <circle cx="58" cy="30" r="2" fill="#67E8F9" opacity="0.8" className="animate-pulse" />
              </>
            )}
          </g>
          
          {/* Mouth - changes shape based on expression - REPOSITIONED */}
          <path 
            d={getMouthPath()}
            stroke="#22D3EE" 
            strokeWidth={expression === 'excited' ? "3.5" : "2.5"}
            strokeLinecap="round" 
            fill="none"
            opacity="0.8"
            filter="url(#glow)"
            className="transition-all duration-300"
          />

          {/* Blush marks when happy/excited */}
          {(expression === 'happy' || expression === 'excited') && (
            <>
              <ellipse cx="16" cy="44" rx="5" ry="4" fill="#F472B6" opacity="0.3" />
              <ellipse cx="64" cy="44" rx="5" ry="4" fill="#F472B6" opacity="0.3" />
            </>
          )}

          {/* Thinking indicator - small dots */}
          {expression === 'thinking' && (
            <g className="animate-thinking">
              <circle cx="54" cy="52" r="2" fill="#22D3EE" opacity="0.6" />
              <circle cx="59" cy="52" r="2" fill="#22D3EE" opacity="0.4" />
              <circle cx="64" cy="52" r="2" fill="#22D3EE" opacity="0.2" />
            </g>
          )}
        </svg>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes wiggle {
          0%, 100% {
            transform: rotate(0deg) scale(1);
          }
          25% {
            transform: rotate(-5deg) scale(1.05);
          }
          50% {
            transform: rotate(5deg) scale(1.05);
          }
          75% {
            transform: rotate(-3deg) scale(1.05);
          }
        }

        @keyframes thinking {
          0%, 100% {
            opacity: 0.2;
          }
          33% {
            opacity: 0.4;
          }
          66% {
            opacity: 0.6;
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-wiggle {
          animation: wiggle 0.8s ease-in-out infinite;
        }

        .animate-thinking {
          animation: thinking 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}