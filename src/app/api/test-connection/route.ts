import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Mostrar las variables de entorno (sin valores sensibles)
    const envInfo = {
      DATABASE_URL_exists: !!process.env.DATABASE_URL,
      DATABASE_URL_length: process.env.DATABASE_URL?.length || 0,
      DATABASE_URL_starts_with: process.env.DATABASE_URL?.substring(0, 20) || 'N/A',
      DIRECT_URL_exists: !!process.env.DIRECT_URL,
      DIRECT_URL_length: process.env.DIRECT_URL?.length || 0,
      DIRECT_URL_starts_with: process.env.DIRECT_URL?.substring(0, 20) || 'N/A',
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
    }

    return NextResponse.json({
      message: '🔍 Información de conexión',
      environment: envInfo,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
