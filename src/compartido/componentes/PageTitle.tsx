'use client'

interface PageTitleProps {
  title: string
  icon?: 'usuarios' | 'roles' | 'productos' | 'inventario' | 'ventas' | 'envios' | 'sucursales' | 'dashboard' | 'reportes' | 'produccion'
  showUnderline?: boolean
}

export function PageTitle({ title, icon = 'usuarios', showUnderline = true }: PageTitleProps) {
  const renderIcon = () => {
    switch (icon) {
      case 'dashboard':
        return (
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-900">
            <circle cx="20" cy="20" r="19" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="1" />
            <g fill="currentColor">
              <rect x="8" y="8" width="12" height="12" rx="1" />
              <rect x="20" y="8" width="12" height="12" rx="1" />
              <rect x="8" y="20" width="12" height="12" rx="1" />
              <rect x="20" y="20" width="12" height="12" rx="1" />
            </g>
          </svg>
        )
      case 'roles':
        return (
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-900">
            <circle cx="20" cy="20" r="19" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="1" />
            <g fill="currentColor">
              <circle cx="12" cy="12" r="3.5" />
              <path d="M 8 18 Q 8 16 12 16 Q 16 16 16 18 L 16 23 Q 16 24 15 24 L 9 24 Q 8 24 8 23 Z" />
              <circle cx="28" cy="12" r="3.5" />
              <path d="M 24 18 Q 24 16 28 16 Q 32 16 32 18 L 32 23 Q 32 24 31 24 L 25 24 Q 24 24 24 23 Z" />
              <circle cx="20" cy="14" r="4" />
              <path d="M 15 22 Q 15 19 20 19 Q 25 19 25 22 L 25 28 Q 25 29 24 29 L 16 29 Q 15 29 15 28 Z" />
            </g>
          </svg>
        )
      case 'productos':
        return (
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-900">
            <circle cx="20" cy="20" r="19" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="1" />
            <g fill="currentColor">
              <rect x="10" y="12" width="8" height="16" rx="1" />
              <rect x="20" y="10" width="8" height="18" rx="1" />
              <rect x="10" y="8" width="8" height="20" rx="1" opacity="0.6" />
            </g>
          </svg>
        )
      case 'inventario':
        return (
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-900">
            <circle cx="20" cy="20" r="19" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="1" />
            <g fill="currentColor">
              <rect x="8" y="10" width="24" height="3" rx="1" />
              <rect x="8" y="15" width="24" height="2" rx="1" opacity="0.8" />
              <rect x="8" y="19" width="24" height="2" rx="1" opacity="0.8" />
              <rect x="8" y="23" width="24" height="2" rx="1" opacity="0.8" />
              <rect x="8" y="27" width="24" height="3" rx="1" />
            </g>
          </svg>
        )
      case 'ventas':
        return (
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-900">
            <circle cx="20" cy="20" r="19" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="1" />
            <g fill="currentColor">
              <path d="M 8 28 L 8 10 L 12 12 L 16 8 L 20 14 L 24 10 L 28 14 L 32 8 L 32 28 Z" />
              <circle cx="20" cy="20" r="2" fill="white" />
            </g>
          </svg>
        )
      case 'envios':
        return (
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-900">
            <circle cx="20" cy="20" r="19" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="1" />
            <g fill="currentColor">
              <path d="M 9 18 L 9 14 Q 9 12 11 12 L 29 12 Q 31 12 31 14 L 31 24 Q 31 26 29 26 L 11 26 Q 9 26 9 24 L 9 22" />
              <path d="M 12 22 L 28 22 M 12 26 L 12 28 M 28 26 L 28 28" strokeWidth="2" stroke="currentColor" fill="none" />
            </g>
          </svg>
        )
      case 'sucursales':
        return (
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-900">
            <circle cx="20" cy="20" r="19" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="1" />
            <g fill="currentColor">
              <path d="M 20 8 L 30 14 L 28 14 L 28 26 L 12 26 L 12 14 L 10 14 Z" />
              <rect x="14" y="16" width="3" height="3" />
              <rect x="18" y="16" width="3" height="3" />
              <rect x="22" y="16" width="3" height="3" />
              <rect x="14" y="21" width="3" height="3" />
              <rect x="18" y="21" width="3" height="3" />
              <rect x="22" y="21" width="3" height="3" />
            </g>
          </svg>
        )
      case 'reportes':
        return (
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-900">
            <circle cx="20" cy="20" r="19" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="1" />
            <g fill="currentColor">
              <rect x="10" y="8" width="20" height="2" rx="1" />
              <rect x="10" y="12" width="20" height="14" rx="1" opacity="0.3" />
              <line x1="12" y1="15" x2="28" y2="15" stroke="currentColor" strokeWidth="1.5" />
              <line x1="12" y1="19" x2="28" y2="19" stroke="currentColor" strokeWidth="1.5" />
              <line x1="12" y1="23" x2="20" y2="23" stroke="currentColor" strokeWidth="1.5" />
            </g>
          </svg>
        )
      case 'produccion':
        return (
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-900">
            <circle cx="20" cy="20" r="19" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="1" />
            <g fill="currentColor">
              <path d="M 10 24 L 10 14 Q 10 12 12 12 L 28 12 Q 30 12 30 14 L 30 24 M 10 24 L 8 28 L 32 28 L 30 24" />
              <circle cx="15" cy="18" r="1.5" />
              <circle cx="20" cy="18" r="1.5" />
              <circle cx="25" cy="18" r="1.5" />
              <rect x="10" y="20" width="20" height="2" opacity="0.6" />
            </g>
          </svg>
        )
      default:
        return (
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-900">
            <circle cx="20" cy="20" r="19" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="1" />
          </svg>
        )
    }
  }

  return (
    <div className="flex items-center gap-3 mb-2">
      {renderIcon()}
      <div className="flex flex-col">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900">
          {title}
        </h1>
        {showUnderline && <div className="h-1 w-24 bg-slate-900 rounded-full mt-1"></div>}
      </div>
    </div>
  )
}
