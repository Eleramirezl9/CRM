import { forwardRef } from 'react'
import type { SelectHTMLAttributes } from 'react'
import { cn } from '@/compartido/lib/utils'

export interface NativeSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  // Props estándar de select HTML
}

/**
 * Componente Select nativo de HTML
 * Usar este componente cuando necesites un <select> HTML estándar
 * Para selects más avanzados, usa Select de Radix UI
 */
const NativeSelect = forwardRef<HTMLSelectElement, NativeSelectProps>(
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
NativeSelect.displayName = 'NativeSelect'

export { NativeSelect }
