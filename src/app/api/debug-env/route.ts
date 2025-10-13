import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Solo permitir en desarrollo o con una clave secreta
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.DEBUG_SECRET || 'debug123'}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const envCheck = {
    // Variables críticas para NextAuth
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '✅ Configurada' : '❌ Faltante',
    
    // Variables de base de datos
    DATABASE_URL: process.env.DATABASE_URL ? '✅ Configurada' : '❌ Faltante',
    DIRECT_URL: process.env.DIRECT_URL ? '✅ Configurada' : '❌ Faltante',
    
    // Variables de Supabase
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ Faltante',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configurada' : '❌ Faltante',
    
    // Información del entorno
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
    VERCEL_URL: process.env.VERCEL_URL,
  }

  return NextResponse.json({
    message: '🔍 Verificación de variables de entorno',
    environment: envCheck,
    timestamp: new Date().toISOString(),
  })
}
