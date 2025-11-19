'use client'

export function UsuariosPageTitle() {
  return (
    <div className="flex items-center gap-3 mb-2">
      {/* SVG Icon personalizado */}
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-slate-900"
      >
        {/* Círculo de fondo */}
        <circle cx="20" cy="20" r="19" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="1" />

        {/* Usuarios grupo */}
        <g fill="currentColor">
          {/* Usuario izquierdo */}
          <circle cx="12" cy="10" r="3.5" />
          <path d="M 8 16 Q 8 14 12 14 Q 16 14 16 16 L 16 22 Q 16 23 15 23 L 9 23 Q 8 23 8 22 Z" />

          {/* Usuario centro */}
          <circle cx="20" cy="8" r="4" />
          <path d="M 15 16 Q 15 13 20 13 Q 25 13 25 16 L 25 24 Q 25 25 24 25 L 16 25 Q 15 25 15 24 Z" />

          {/* Usuario derecho */}
          <circle cx="28" cy="10" r="3.5" />
          <path d="M 24 16 Q 24 14 28 14 Q 32 14 32 16 L 32 22 Q 32 23 31 23 L 25 23 Q 24 23 24 22 Z" />
        </g>
      </svg>

      {/* Título con estilos mejorados */}
      <div className="flex flex-col">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900">
          Gestión de Usuarios
        </h1>
        <div className="h-1 w-24 bg-slate-900 rounded-full mt-1"></div>
      </div>
    </div>
  )
}
