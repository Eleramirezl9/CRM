import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Administración Multi-Sucursal',
  description: 'Software de Administración Empresarial Multi-Sucursal',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
