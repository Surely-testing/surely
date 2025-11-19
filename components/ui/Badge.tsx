// ============================================
// FILE: components/ui/Badge.tsx
// ============================================
import * as React from 'react'
import { cn } from '@/lib/utils/cn'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'sm' | 'md' | 'lg'
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    const variants = {
      default: 'bg-muted text-muted-foreground',
      primary: 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100',
      success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-success',
      warning: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-warning',
      danger: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-error',
      info: 'bg-blue-50 text-info dark:bg-blue-800/30 dark:text-info',
    }

    const sizes = {
      sm: 'text-xs px-2 py-0.5',
      md: 'text-sm px-2.5 py-0.5',
      lg: 'text-base px-3 py-1',
    }

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full font-medium',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    )
  }
)

Badge.displayName = 'Badge'

export { Badge }