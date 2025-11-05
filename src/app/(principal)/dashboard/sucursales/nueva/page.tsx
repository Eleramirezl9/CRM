import SucursalForm from '../sucursal-form'

export default function NuevaSucursalPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nueva Sucursal</h1>
        <p className="text-muted-foreground mt-1">
          Crear una nueva sucursal para la empresa
        </p>
      </div>

      <SucursalForm />
    </div>
  )
}
