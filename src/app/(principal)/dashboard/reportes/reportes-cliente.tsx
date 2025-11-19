'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'
import { PageTitle } from '@/compartido/componentes/PageTitle'

const data = [
  { name: 'Ene', ventas: 4000, utilidad: 1000 },
  { name: 'Feb', ventas: 3000, utilidad: 1200 },
  { name: 'Mar', ventas: 5000, utilidad: 1600 },
  { name: 'Abr', ventas: 3500, utilidad: 900 },
]

export default function ReportesCliente() {
  const download = (type: 'pdf' | 'excel') => {
    alert(`Descarga simulada de ${type.toUpperCase()}`)
  }
  return (
    <div className="space-y-6 p-4 sm:p-8">
      <div>
        <PageTitle title="Reportes y Análisis" icon="reportes" />
        <p className="text-muted-foreground mt-1">Visualiza métricas y descargas reportes</p>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="ventas" stroke="#3b82f6" />
            <Line type="monotone" dataKey="utilidad" stroke="#10b981" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-2">
        <button className="bg-blue-600 text-white px-3 py-2 rounded" onClick={() => download('pdf')}>Descargar PDF</button>
        <button className="bg-green-600 text-white px-3 py-2 rounded" onClick={() => download('excel')}>Descargar Excel</button>
      </div>
    </div>
  )
}
