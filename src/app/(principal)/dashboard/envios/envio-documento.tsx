'use client'

import { forwardRef } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

type EnvioDocumento = {
  id: string
  estado: string
  createdAt: Date
  sucursalOrigen: { nombre: string }
  sucursalDestino: { nombre: string }
  items: Array<{
    producto: { nombre: string; sku?: string }
    cantidadSolicitada: number
    cantidadEnviada?: number
    cantidadRecibida?: number
  }>
  creador?: { nombre: string } | null
}

interface Props {
  envio: EnvioDocumento
}

const EnvioDocumentoImprimible = forwardRef<HTMLDivElement, Props>(({ envio }, ref) => {
  const fecha = format(new Date(envio.createdAt), "dd 'de' MMMM yyyy", { locale: es })
  const hora = format(new Date(envio.createdAt), 'HH:mm', { locale: es })

  return (
    <div ref={ref} className="p-6 bg-white text-black max-w-md mx-auto font-mono text-sm">
      {/* Header */}
      <div className="text-center border-b-2 border-black pb-4 mb-4">
        <h1 className="text-xl font-bold mb-1">DOCUMENTO DE ENVIO</h1>
        <div className="text-xs">#{envio.id.slice(0, 8).toUpperCase()}</div>
      </div>

      {/* Info del envío */}
      <div className="space-y-2 mb-4 text-xs">
        <div className="flex justify-between">
          <span className="font-bold">Fecha:</span>
          <span>{fecha}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">Hora:</span>
          <span>{hora}</span>
        </div>
        <div className="border-t border-dashed pt-2 mt-2">
          <div className="flex justify-between">
            <span className="font-bold">Origen:</span>
            <span>{envio.sucursalOrigen.nombre}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold">Destino:</span>
            <span>{envio.sucursalDestino.nombre}</span>
          </div>
        </div>
      </div>

      {/* Tabla de productos */}
      <div className="border-t-2 border-b-2 border-black py-2 mb-4">
        <div className="grid grid-cols-[1fr_60px] gap-2 font-bold text-xs mb-2 pb-1 border-b border-dashed">
          <div>PRODUCTO</div>
          <div className="text-center">CANT</div>
        </div>

        <div className="space-y-1">
          {envio.items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_60px] gap-2 text-xs py-1">
              <div className="truncate">{item.producto.nombre}</div>
              <div className="text-center font-bold">{item.cantidadSolicitada}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Totales */}
      <div className="text-xs mb-4">
        <div className="flex justify-between font-bold">
          <span>TOTAL PRODUCTOS:</span>
          <span>{envio.items.length}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>TOTAL UNIDADES:</span>
          <span>{envio.items.reduce((sum, item) => sum + item.cantidadSolicitada, 0)}</span>
        </div>
      </div>

      {/* Firmas */}
      <div className="border-t border-dashed pt-4 mt-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="border-b border-black mb-1 h-12"></div>
            <div className="text-xs">Entrega</div>
          </div>
          <div className="text-center">
            <div className="border-b border-black mb-1 h-12"></div>
            <div className="text-xs">Recibe</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      {envio.creador && (
        <div className="text-center text-xs mt-4 pt-2 border-t border-dashed">
          <span>Creado por: {envio.creador.nombre}</span>
        </div>
      )}
    </div>
  )
})

EnvioDocumentoImprimible.displayName = 'EnvioDocumentoImprimible'

export default EnvioDocumentoImprimible
