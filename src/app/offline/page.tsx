export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 p-8">
        <h1 className="text-4xl font-bold">Sin conexión</h1>
        <p className="text-muted-foreground">
          No hay conexión a internet. Por favor, verifica tu conexión.
        </p>
      </div>
    </div>
  )
}
