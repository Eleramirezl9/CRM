import EnvioForm from '../envio-form'

export default function NuevoEnvioPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold">Nuevo Envío</h1>
        <p className="text-muted-foreground mt-2">Planificar traslado de productos entre sucursales</p>
      </div>
      
      <EnvioForm />
    </div>
  )
}
