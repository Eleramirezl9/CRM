import NextAuth, { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      rol: 'administrador' | 'bodega' | 'sucursal' | 'produccion'
      sucursalId?: string | null
      permisos?: string[] // Permisos del rol + individuales
      activo?: boolean
    } & DefaultSession['user']
  }

  interface User {
    id: string
    rol: 'administrador' | 'bodega' | 'sucursal' | 'produccion'
    sucursalId?: string | null
    permisos?: string[]
    activo?: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    rol: 'administrador' | 'bodega' | 'sucursal' | 'produccion'
    sucursalId?: string | null
    permisos?: string[] // Permisos combinados (rol + individuales)
    activo?: boolean
    permisosLastUpdate?: number // Timestamp de última actualización de permisos
  }
}
