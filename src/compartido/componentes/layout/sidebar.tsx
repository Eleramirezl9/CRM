'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { cn } from '@/compartido/lib/utils'
import { useCallback, useMemo } from 'react'

// Todos los links posibles con sus permisos requeridos
const allLinks = [
  { href: '/dashboard', label: '📊 Dashboard', permission: null }, // Siempre visible para admin
  { href: '/dashboard/usuarios', label: '👥 Usuarios', permission: 'usuarios.ver' },
  { href: '/dashboard/roles', label: '🛡️ Roles y Permisos', permission: 'roles.ver' },
  { href: '/dashboard/productos', label: '📦 Productos', permission: 'productos.ver' },
  { href: '/dashboard/inventario', label: '📋 Inventario', permission: 'inventario.ver' },
  { href: '/dashboard/envios', label: '🚚 Envíos', permission: 'envios.ver' },
  { href: '/dashboard/ventas', label: '💰 Ventas', permission: 'ventas.ver' },
  { href: '/dashboard/sucursales', label: '🏢 Sucursales', permission: 'sucursales.ver' },
  { href: '/dashboard/produccion', label: '🏭 Producción', permission: 'produccion.ver' },
  { href: '/dashboard/reportes', label: '📈 Reportes', permission: 'reportes.ver' },
]

// Links por defecto por rol (fallback si no hay permisos individuales)
const linksByRole: Record<string, { href: string; label: string }[]> = {
  administrador: allLinks,
  bodega: [
    { href: '/dashboard/inventario', label: '📋 Inventario' },
    { href: '/dashboard/envios', label: '🚚 Envíos' },
  ],
  sucursal: [
    { href: '/dashboard/ventas', label: '💰 Ventas' },
    { href: '/dashboard/inventario', label: '📋 Inventario' },
  ],
  produccion: [
    { href: '/dashboard/produccion', label: '🏭 Producción Diaria' },
    { href: '/dashboard/inventario', label: '📋 Inventario' },
  ],
}

interface SidebarProps {
  role: 'administrador' | 'bodega' | 'sucursal' | 'produccion'
  sucursalId?: string | null
}

export default function Sidebar({ role, sucursalId }: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()

  // Obtener permisos del usuario desde la sesión
  const userPermissions = (session?.user as any)?.permisos || []

  // Calcular links visibles basándose en permisos
  const links = useMemo(() => {
    // Administrador siempre ve todo
    if (role === 'administrador') {
      return allLinks
    }

    // Si tiene permisos individuales, filtrar por permisos
    if (userPermissions.length > 0) {
      return allLinks.filter(link => {
        // Si el link no requiere permiso especial, mostrarlo
        if (!link.permission) return false

        // Verificar si tiene el permiso
        return userPermissions.includes(link.permission)
      })
    }

    // Fallback: usar links por rol
    return linksByRole[role] ?? []
  }, [role, userPermissions])

  const handleSignOut = useCallback(async () => {
    await signOut({ callbackUrl: '/iniciar-sesion' })
  }, [])
  
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
          
          {/* Enlace especial para gerentes de sucursal */}
          {role === 'sucursal' && sucursalId && (
            <Link 
              href={`/dashboard/sucursales/${sucursalId}/perfil`}
              prefetch={true}
              className={cn(
                "block px-3 py-2 rounded transition-colors duration-150",
                pathname.includes('/sucursales/') && pathname.includes('/perfil')
                  ? "bg-blue-100 text-blue-700 font-medium" 
                  : "hover:bg-gray-100 text-gray-700"
              )}
            >
              🏪 Mi Sucursal
            </Link>
          )}
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
