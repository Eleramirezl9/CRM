'use client'

import Link from 'next/link'
import { Button } from '@/compartido/componentes/ui/button'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'

export default function NoAutorizadoPage() {
  return (
    <div className="min-h-screen grid place-items-center p-6 bg-gray-50">
      <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-lg shadow-lg">
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="h-10 w-10 text-red-600" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Acceso Denegado</h1>
          <p className="text-gray-600">
            No tienes los permisos necesarios para acceder a esta sección.
          </p>
          <p className="text-sm text-gray-500">
            Si crees que deberías tener acceso, contacta al administrador del sistema.
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <Link href="/dashboard">
            <Button className="w-full" size="lg">
              <Home className="mr-2 h-4 w-4" />
              Volver al Inicio
            </Button>
          </Link>

          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => {
              // Recargar la página actual para refrescar permisos
              window.location.reload()
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refrescar Permisos
          </Button>
        </div>

        <div className="pt-4 border-t">
          <p className="text-xs text-gray-500">
            Si acabas de recibir permisos nuevos, haz clic en "Refrescar Permisos"
          </p>
        </div>
      </div>
    </div>
  )
}
