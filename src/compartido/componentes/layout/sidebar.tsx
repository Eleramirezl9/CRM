'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { cn } from '@/compartido/lib/utils'

const linksByRole: Record<string, { href: string; label: string }[]> = {
  administrador: [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dashboard/productos', label: 'Productos' },
    { href: '/dashboard/inventario', label: 'Inventario' },
    { href: '/dashboard/envios', label: 'Envíos' },
    { href: '/dashboard/reportes', label: 'Reportes' },
  ],
  bodega: [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dashboard/inventario', label: 'Inventario' },
    { href: '/dashboard/envios', label: 'Envíos' },
  ],
  sucursal: [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dashboard/ventas', label: 'Ventas' },
    { href: '/dashboard/inventario', label: 'Inventario' },
  ],
}

export default function Sidebar({ role }: { role: 'administrador' | 'bodega' | 'sucursal' }) {
  const pathname = usePathname()
  const links = linksByRole[role] ?? []
  
  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/iniciar-sesion' })
  }
  
  return (
    <aside className="border-r bg-white p-4 space-y-4 flex flex-col h-screen">
      <div>
        <div className="text-lg font-semibold mb-4">Multi-Sucursal</div>
        <nav className="space-y-2">
          {links.map((l) => {
            const isActive = pathname === l.href || (l.href !== '/dashboard' && pathname.startsWith(l.href))
            return (
              <Link 
                key={l.href} 
                href={l.href as any}
                prefetch={true}
                className={cn(
                  "block px-3 py-2 rounded transition-colors duration-150",
                  isActive 
                    ? "bg-blue-100 text-blue-700 font-medium" 
                    : "hover:bg-gray-100 text-gray-700"
                )}
              >
                {l.label}
              </Link>
            )
          })}
        </nav>
      </div>
      
      <div className="mt-auto border-t pt-4">
        <button
          onClick={handleSignOut}
          className="w-full px-3 py-2 text-left rounded transition-colors duration-150 hover:bg-red-50 text-red-600 font-medium"
        >
          🚪 Cerrar Sesión
        </button>
      </div>
    </aside>
  )
}
