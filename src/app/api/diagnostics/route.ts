import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const envs = {
    NEXTAUTH_URL: Boolean(process.env.NEXTAUTH_URL),
    NEXTAUTH_SECRET: Boolean(process.env.NEXTAUTH_SECRET),
    DATABASE_URL: Boolean(process.env.DATABASE_URL),
    DIRECT_URL: Boolean(process.env.DIRECT_URL),
    NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  }

  try {
    // Simple DB connectivity check
    await prisma.$queryRaw`SELECT 1 as ok`

    // Optional lightweight checks (commented to keep it fast and safe)
    // const rolesCount = await prisma.role.count()
    // const usersCount = await prisma.usuario.count()

    return NextResponse.json({
      ok: true,
      envs,
      db: 'connected',
      // roles: rolesCount,
      // usuarios: usersCount,
    })
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      envs,
      db: 'disconnected',
      error: error?.message ?? String(error),
    }, { status: 500 })
  }
}
