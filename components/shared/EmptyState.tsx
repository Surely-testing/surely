import * as React from 'react'
import { Inbox, FileQuestion, Plus, Upload, Sparkles } from 'lucide-react'

export interface EmptyStateAction {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'accent'
  icon?: React.ComponentType<{ className?: string }>
}

export interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string; size?: number; strokeWidth?: number }>
  iconSize?: number
  title: string
  description?: string
  actions?: EmptyStateAction[]
  className?: string
  minHeight?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  iconSize = 64,
  title,
  description,
  actions,
  className = '',
  minHeight = '400px',
}) => {
  return (
    <div 
      className={`flex flex-col items-center justify-center text-center px-4 ${className}`}
      style={{ minHeight }}
    >
      {/* Icon */}
      <Icon 
        className="text-muted-foreground mb-4" 
        size={iconSize}
        strokeWidth={1.5}
      />
      
      {/* Title */}
      <h3 className="text-lg font-medium text-foreground mb-2">
        {title}
      </h3>
      
      {/* Description */}
      {description && (
        <p className="text-sm text-muted-foreground mb-6 max-w-md">
          {description}
        </p>
      )}
      
      {/* Actions */}
      {actions && actions.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center gap-3 flex-wrap justify-center">
          {actions.map((action, index) => {
            const ActionIcon = action.icon;
            const baseClasses = "inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 w-full sm:w-auto";
            
            let variantClasses = "";
            if (action.variant === 'primary') {
              variantClasses = "btn-primary";
            } else if (action.variant === 'accent') {
              variantClasses = "text-primary-foreground bg-gradient-accent hover:shadow-glow-accent";
            } else {
              variantClasses = "font-medium text-foreground bg-card border border-border hover:bg-muted hover:border-primary";
            }
            
            return (
              <button
                key={index}
                onClick={action.onClick}
                className={`${baseClasses} ${variantClasses}`}
              >
                {ActionIcon && <ActionIcon className="h-4 w-4 mr-2" />}
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  )
}
