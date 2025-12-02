import * as React from 'react'
import { Button } from '@/components/ui/Button'
import { FileQuestion, Inbox } from 'lucide-react'

export interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  action?: React.ReactNode
  defaultIcon?: 'inbox' | 'question'
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  action,
  defaultIcon = 'inbox',
}) => {
  const DefaultIcon = defaultIcon === 'inbox' ? Inbox : FileQuestion;
  
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon ? (
        <div className="mb-4 text-muted-foreground opacity-50">
          {icon}
        </div>
      ) : (
        <div className="mb-4 text-muted-foreground opacity-30">
          <DefaultIcon size={64} strokeWidth={1.5} />
        </div>
      )}
      <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
      )}
      {action ? (
        <div>{action}</div>
      ) : actionLabel && onAction ? (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}

export { EmptyState }