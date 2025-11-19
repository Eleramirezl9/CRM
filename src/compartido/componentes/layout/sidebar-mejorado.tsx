'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { cn } from '@/compartido/lib/utils'
import { useCallback, useMemo, useState } from 'react'
import {
  LayoutDashboard,
  Users,
  Shield,
  Package,
  ClipboardList,
  Truck,
  DollarSign,
  Building2,
  Factory,
  TrendingUp,
  Store,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet'
import { Button } from '../ui/button'

// Mapeo de permisos a iconos (iconos profesionales de Lucide)
const iconMap = {
  dashboard: LayoutDashboard,
  usuarios: Users,
  roles: Shield,
  productos: Package,
  inventario: ClipboardList,
  envios: Truck,
  ventas: DollarSign,
  sucursales: Building2,
  produccion: Factory,
  reportes: TrendingUp,
  store: Store,
  logout: LogOut,
}

// Todos los links posibles con sus permisos requeridos
const allLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: iconMap.dashboard, permission: null },
  { href: '/dashboard/usuarios', label: 'Usuarios', icon: iconMap.usuarios, permission: 'usuarios.ver' },
  { href: '/dashboard/roles', label: 'Roles y Permisos', icon: iconMap.roles, permission: 'roles.ver' },
  { href: '/dashboard/productos', label: 'Productos', icon: iconMap.productos, permission: 'productos.ver' },
  { href: '/dashboard/inventario', label: 'Inventario', icon: iconMap.inventario, permission: 'inventario.ver' },
  { href: '/dashboard/envios', label: 'Envíos', icon: iconMap.envios, permission: 'envios.ver' },
  { href: '/dashboard/ventas', label: 'Ventas', icon: iconMap.ventas, permission: 'ventas.ver' },
  { href: '/dashboard/sucursales', label: 'Sucursales', icon: iconMap.sucursales, permission: 'sucursales.ver' },
  { href: '/dashboard/produccion', label: 'Producción', icon: iconMap.produccion, permission: 'produccion.ver' },
  { href: '/dashboard/reportes', label: 'Reportes', icon: iconMap.reportes, permission: 'reportes.ver' },
]

// Type para los links
type NavLink = {
  href: string
  label: string
  icon: any
  permission: string | null
}

// Links por defecto por rol (fallback si no hay permisos individuales)
const linksByRole: Record<string, NavLink[]> = {
  administrador: allLinks,
  bodega: [
    { href: '/dashboard/inventario', label: 'Inventario', icon: iconMap.inventario, permission: 'inventario.ver' },
    { href: '/dashboard/envios', label: 'Envíos', icon: iconMap.envios, permission: 'envios.ver' },
  ],
  sucursal: [
    { href: '/dashboard/ventas', label: 'Ventas', icon: iconMap.ventas, permission: 'ventas.ver' },
    { href: '/dashboard/inventario', label: 'Inventario', icon: iconMap.inventario, permission: 'inventario.ver' },
  ],
  produccion: [
    { href: '/dashboard/produccion', label: 'Producción Diaria', icon: iconMap.produccion, permission: 'produccion.ver' },
    { href: '/dashboard/inventario', label: 'Inventario', icon: iconMap.inventario, permission: 'inventario.ver' },
  ],
}

interface SidebarProps {
  role: 'administrador' | 'bodega' | 'sucursal' | 'produccion'
  sucursalId?: string | null
}

// Componente interno para el contenido del sidebar (reutilizado en móvil y desktop)
function SidebarContent({
  role,
  sucursalId,
  pathname,
  links,
  handleSignOut,
  onLinkClick
}: SidebarProps & {
  pathname: string
  links: NavLink[]
  handleSignOut: () => void
  onLinkClick?: () => void
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-6 border-b">
        <h1 className="text-xl font-bold text-primary">Nuestro Pan</h1>
        <p className="text-xs text-muted-foreground mt-1">
          {role === 'administrador' ? 'Administrador' :
           role === 'bodega' ? 'Bodega' :
           role === 'sucursal' ? 'Sucursal' : 'Producción'}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon
          const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href))

          return (
            <Link
              key={link.href}
              href={link.href as any}
              prefetch={true}
              onClick={onLinkClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 flex-shrink-0 transition-transform duration-200",
                isActive ? "" : "group-hover:scale-110"
              )} />
              <span className="flex-1">{link.label}</span>
              {isActive && <ChevronRight className="w-4 h-4 flex-shrink-0" />}
            </Link>
          )
        })}

        {/* Enlace especial para gerentes de sucursal */}
        {role === 'sucursal' && sucursalId && (
          <Link
            href={`/dashboard/sucursales/${sucursalId}/perfil`}
            prefetch={true}
            onClick={onLinkClick}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
              pathname.includes('/sucursales/') && pathname.includes('/perfil')
                ? "bg-primary text-primary-foreground shadow-sm font-medium"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Store className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform duration-200" />
            <span className="flex-1">Mi Sucursal</span>
          </Link>
        )}
      </nav>

      {/* Footer - Cerrar Sesión */}
      <div className="p-3 border-t">
        <button
          onClick={() => {
            handleSignOut()
            onLinkClick?.()
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-destructive hover:bg-destructive/10 font-medium group"
        >
          <LogOut className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform duration-200" />
          <span className="flex-1 text-left">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  )
}

export default function Sidebar({ role, sucursalId }: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)

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
        // Dashboard siempre visible para usuarios autenticados
        if (link.href === '/dashboard') return true

        // Si el link no requiere permiso especial, no mostrarlo
        if (!link.permission) return false

        // Verificar si tiene el permiso
        return userPermissions.includes(link.permission)
      })
    }

    // Fallback: usar links por rol
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Usuario usando fallback de rol sin permisos explícitos: ${role}`)
    }
    return linksByRole[role] ?? []
  }, [role, userPermissions])

  const handleSignOut = useCallback(async () => {
    await signOut({ callbackUrl: '/iniciar-sesion' })
  }, [])

  return (
    <>
      {/* Mobile Header con botón hamburguesa */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-background border-b px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-primary">Nuestro Pan</h1>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Abrir menú</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0">
            <SidebarContent
              role={role}
              sucursalId={sucursalId}
              pathname={pathname}
              links={links}
              handleSignOut={handleSignOut}
              onLinkClick={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar - Oculto en móviles, fijo en desktop */}
      <aside className="hidden md:flex flex-col h-screen w-[240px] border-r bg-background flex-shrink-0">
        <SidebarContent
          role={role}
          sucursalId={sucursalId}
          pathname={pathname}
          links={links}
          handleSignOut={handleSignOut}
        />
      </aside>
    </>
  )
}
