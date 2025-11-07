import NextAuth, { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      rol: 'administrador' | 'bodega' | 'sucursal' | 'produccion'
      sucursalId?: string | null
    } & DefaultSession['user']
  }

  interface User {
    id: string
    rol: 'administrador' | 'bodega' | 'sucursal' | 'produccion'
    sucursalId?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    rol: 'administrador' | 'bodega' | 'sucursal' | 'produccion'
    sucursalId?: string | null
  }
}
