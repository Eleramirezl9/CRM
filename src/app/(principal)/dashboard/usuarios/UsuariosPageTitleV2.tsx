'use client'

export function UsuariosPageTitleV2() {
  return (
    <div className="mb-2">
      {/* Versión 2: Título con estilo más moderno y profesional */}
      <div className="flex items-end gap-4">
        {/* SVG Badge */}
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-slate-900 flex-shrink-0"
        >
          {/* Fondo degradado */}
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#1f2937', stopOpacity: 0.1 }} />
              <stop offset="100%" style={{ stopColor: '#111827', stopOpacity: 0.1 }} />
            </linearGradient>
          </defs>

          <rect width="48" height="48" rx="12" fill="url(#grad)" />
          <rect width="48" height="48" rx="12" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.2" />

          {/* Usuarios */}
          <g fill="currentColor">
            {/* Usuario 1 */}
            <circle cx="13" cy="12" r="3" />
            <path d="M 9 18 Q 9 16 13 16 Q 17 16 17 18 L 17 23 Q 17 24 16 24 L 10 24 Q 9 24 9 23 Z" />

            {/* Usuario 2 (centro-principal) */}
            <circle cx="24" cy="10" r="3.5" />
            <path d="M 19 17 Q 19 14 24 14 Q 29 14 29 17 L 29 25 Q 29 26 28 26 L 20 26 Q 19 26 19 25 Z" />

            {/* Usuario 3 */}
            <circle cx="35" cy="12" r="3" />
            <path d="M 31 18 Q 31 16 35 16 Q 39 16 39 18 L 39 23 Q 39 24 38 24 L 32 24 Q 31 24 31 23 Z" />
          </g>
        </svg>

        {/* Título */}
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 leading-tight">
            Gestión de
            <br />
            <span className="text-slate-900">
              Usuarios
            </span>
          </h1>
        </div>
      </div>

      {/* Línea decorativa */}
      <div className="flex gap-1 mt-4">
        <div className="h-1 w-8 bg-slate-900 rounded-full"></div>
        <div className="h-1 w-4 bg-slate-400 rounded-full"></div>
        <div className="h-1 w-2 bg-slate-300 rounded-full"></div>
      </div>
    </div>
  )
}
