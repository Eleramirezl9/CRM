import type { NextAuthOptions } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { CustomPrismaAdapter } from './adapter'

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  adapter: CustomPrismaAdapter(),
  pages: {
    signIn: '/iniciar-sesion',
  },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        correo: { label: 'Correo', type: 'text' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.correo || !credentials?.password) {
          console.log('❌ Credenciales vacías')
          return null
        }
        const user = await prisma.usuario.findUnique({
          where: { correo: credentials.correo },
          include: { rol: true, sucursalGerente: true },
        })
        if (!user) {
          console.log('❌ Usuario no encontrado:', credentials.correo)
          return null
        }
        const ok = await bcrypt.compare(credentials.password, user.contrasenaHash)
        console.log('🔐 Comparación de contraseña:', ok)
        if (!ok) return null
        return {
          id: String(user.id),
          name: user.nombre,
          email: user.correo,
          rol: (user.rol?.nombre as 'administrador' | 'bodega' | 'sucursal') ?? 'sucursal',
          sucursalId: user.sucursalGerente?.id ? String(user.sucursalGerente.id) : null,
        } as any
      },
      
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id
        token.rol = (user as any).rol
        token.sucursalId = (user as any).sucursalId ?? null
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id)
        session.user.rol = token.rol as any
        session.user.sucursalId = (token as any).sucursalId ?? null
      }
      return session
    },
  },
}
