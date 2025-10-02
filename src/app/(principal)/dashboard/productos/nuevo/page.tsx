import ProductoForm from '../producto-form'

export default function NuevoProductoPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Nuevo Producto</h1>
        <p className="text-muted-foreground mt-2">El SKU se generará automáticamente</p>
      </div>
      
      <ProductoForm />
    </div>
  )
}
