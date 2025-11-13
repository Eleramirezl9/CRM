/**
 * Providers Component
 *
 * Envuelve la aplicación con los providers necesarios de Next.js y NextAuth.
 * Debe ser un Client Component para usar contextos de React.
 */

'use client'

import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'
import { Toaster } from 'sonner'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      {children}
      <Toaster position="top-right" richColors />
    </SessionProvider>
  )
}
