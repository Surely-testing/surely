import * as React from "react"
import { cn } from "@/lib/utils/cn"

const Table = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("space-y-4 w-full", className)}
    {...props}
  />
))
Table.displayName = "Table"

const TableRow = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    selected?: boolean
    selectable?: boolean
  }
>(({ className, selected, selectable, ...props }, ref) => {
  const [isHovering, setIsHovering] = React.useState(false)

  return (
    <div className="relative mb-4 group">
      <div
        ref={ref}
        className={cn(
          "relative border rounded-lg transition-all p-4",
          selectable && "pl-12",
          selected
            ? "bg-primary/5 border-primary/50"
            : isHovering
              ? "bg-accent/5 border-border"
              : "bg-transparent border-border",
          className
        )}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        data-state={selected ? "selected" : undefined}
        {...props}
      />
    </div>
  )
})
TableRow.displayName = "TableRow"

const TableCell = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("min-w-0", className)}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableGrid = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    columns?: number
  }
>(({ className, columns = 4, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex-1 min-w-0 grid gap-4 items-center",
      className
    )}
    style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    {...props}
  >
    {children}
  </div>
))
TableGrid.displayName = "TableGrid"

const TableCheckbox = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    checked?: boolean
    onCheckedChange?: (checked: boolean) => void
  }
>(({ className, checked, onCheckedChange, ...props }, ref) => (
  <div
    ref={ref}
    role="checkbox"
    aria-checked={checked}
    onClick={(e) => {
      e.preventDefault()
      e.stopPropagation()
      onCheckedChange?.(!checked)
    }}
    className={cn(
      "absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded border-2 border-border cursor-pointer transition-all flex items-center justify-center",
      checked 
        ? "bg-primary border-primary opacity-100" 
        : "hover:border-primary/50 group-hover:opacity-100 opacity-0",
      className
    )}
    {...props}
  >
    {checked && (
      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
      </svg>
    )}
  </div>
))
TableCheckbox.displayName = "TableCheckbox"

const TableSelectAll = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    checked?: boolean
    onCheckedChange?: (checked: boolean) => void
  }
>(({ className, checked, onCheckedChange, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center gap-3", className)} {...props}>
    <div
      role="checkbox"
      aria-checked={checked}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        "w-5 h-5 rounded border-2 cursor-pointer transition-all flex items-center justify-center",
        checked ? "bg-primary border-primary" : "border-border hover:border-primary/50"
      )}
    >
      {checked && (
        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </div>
    <span className="text-sm text-muted-foreground">Select All</span>
  </div>
))
TableSelectAll.displayName = "TableSelectAll"

const TableEmpty = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    icon?: React.ReactNode
    title: string
    description?: string
  }
>(({ className, icon, title, description, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "bg-card rounded-2xl shadow-sm p-8 sm:p-12 border border-border text-center",
      className
    )}
    {...props}
  >
    {icon && (
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
    )}
    <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
    {description && <p className="text-muted-foreground">{description}</p>}
  </div>
))
TableEmpty.displayName = "TableEmpty"

const TableHeaderText = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-sm font-semibold text-foreground truncate", className)}
    {...props}
  />
))
TableHeaderText.displayName = "TableHeaderText"

const TableDescriptionText = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-xs text-muted-foreground truncate", className)}
    {...props}
  />
))
TableDescriptionText.displayName = "TableDescriptionText"

export {
  Table,
  TableRow,
  TableCell,
  TableGrid,
  TableCheckbox,
  TableSelectAll,
  TableEmpty,
  TableHeaderText,
  TableDescriptionText,
}