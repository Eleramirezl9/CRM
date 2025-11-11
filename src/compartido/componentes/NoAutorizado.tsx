'use client'

import { Button } from '@/compartido/componentes/ui/button'
import { AlertTriangle, LogOut, RefreshCw } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { useState } from 'react'

export function NoAutorizado() {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await signOut({ callbackUrl: '/iniciar-sesion' })
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
      setIsLoggingOut(false)
    }
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    window.location.reload()
  }

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
          <Button
            className="w-full"
            size="lg"
            onClick={handleLogout}
            disabled={isLoggingOut || isRefreshing}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar Sesión e Iniciar de Nuevo'}
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={handleRefresh}
            disabled={isLoggingOut || isRefreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refrescando...' : 'Refrescar Permisos'}
          </Button>
        </div>

        <div className="pt-4 border-t">
          <p className="text-xs text-gray-500">
            <strong>¿Acabas de recibir permisos?</strong>
            <br />
            Haz clic en "Refrescar Permisos" para actualizar.
            <br />
            <br />
            <strong>¿No tienes acceso?</strong>
            <br />
            Cierra sesión e inicia de nuevo para refrescar completamente.
          </p>
        </div>
      </div>
    </div>
  )
}
