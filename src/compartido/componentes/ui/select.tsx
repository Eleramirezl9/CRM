import { forwardRef } from 'react'
import type { SelectHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/compartido/lib/utils'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    )
  }
)
Select.displayName = 'Select'

// Componentes adicionales para compatibilidad con shadcn/ui
const SelectTrigger = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    )
  }
)
SelectTrigger.displayName = 'SelectTrigger'

const SelectContent = ({ children, ...props }: { children: ReactNode }) => {
  return <>{children}</>
}

const SelectItem = ({ value, children, ...props }: { value: string; children: ReactNode }) => {
  return <option value={value} {...props}>{children}</option>
}

const SelectValue = ({ placeholder }: { placeholder?: string }) => {
  return <>{placeholder}</>
}

export { Select, SelectTrigger, SelectContent, SelectItem, SelectValue }
