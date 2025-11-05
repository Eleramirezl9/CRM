import { forwardRef } from 'react'
import type { SelectHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/compartido/lib/utils'

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  onValueChange?: (value: string) => void
  onChange?: React.ChangeEventHandler<HTMLSelectElement>
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, onValueChange, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (onValueChange) {
        onValueChange(e.target.value)
      }
      if (onChange) {
        onChange(e)
      }
    }

    return (
      <select
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        onChange={handleChange}
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
  ({ className, children, onValueChange, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (onValueChange) {
        onValueChange(e.target.value)
      }
      if (onChange) {
        onChange(e)
      }
    }

    return (
      <select
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        onChange={handleChange}
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

const SelectItem = ({ value, children, disabled, ...props }: { value: string; children: ReactNode; disabled?: boolean }) => {
  return <option value={value} disabled={disabled} {...props}>{children}</option>
}

const SelectValue = ({ placeholder }: { placeholder?: string }) => {
  return <>{placeholder}</>
}

export { Select, SelectTrigger, SelectContent, SelectItem, SelectValue }
