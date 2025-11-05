# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Multi-branch CRM system built for managing inventory, sales, and shipments across multiple locations. The system supports role-based access control with three user roles: administrator (full access), bodega (warehouse - inventory + shipments), and sucursal (branch - sales + inventory).

**Tech Stack:**
- Next.js 14 (App Router)
- TypeScript
- Prisma ORM
- Supabase (PostgreSQL)
- NextAuth.js for authentication
- Tailwind CSS + shadcn/ui components
- Deployed on Vercel (serverless)

## Architectural Pattern

This project follows **Feature-Driven Architecture** (Vertical Slice) combined with **Next.js 14 Server Actions**.

### What it IS:
- ✅ **Feature-Driven**: Organized by business capabilities (productos/, ventas/, inventario/)
- ✅ **Screaming Architecture**: Folder structure reveals what the system does
- ✅ **Server Actions Pattern**: Business logic in `caracteristicas/*/acciones.ts` files
- ✅ **Vertical Slices**: Each feature contains its complete logic (not split into layers)

### What it is NOT:
- ❌ **NOT MVC**: No separate controllers/models/views folders
- ❌ **NOT Hexagonal**: No ports/adapters abstraction, Prisma called directly
- ❌ **NOT Layered**: Not organized by technical layers (controllers/, services/, repositories/)

### Architecture Layers:
```
Presentation (UI)          → src/app/
     ↓ calls
Business Logic (Features)  → src/caracteristicas/*/acciones.ts ('use server')
     ↓ uses
Data Access (ORM)          → Prisma Client
     ↓ persists
Database                   → Supabase (PostgreSQL)
```

### Key Principles:
1. **Domain-driven organization**: Features grouped by business domain, not technology
2. **Colocation**: Related code stays together (UI + logic for each feature)
3. **Server Actions**: Replace traditional API controllers with Next.js Server Actions
4. **Direct data access**: Prisma called directly from business logic (no repository layer)

See `ARCHITECTURE.md` for detailed explanation and flow diagrams.

## Development Commands

### Daily Development
```bash
npm run dev              # Start development server on port 3000
npm run build            # Build for production
npm start                # Start production server on port 3000
npm run lint             # Run ESLint
```

### Database Operations
```bash
npm run prisma:generate  # Generate Prisma client (run after schema changes)
npm run prisma:migrate   # Create and apply database migrations
npm run prisma:studio    # Open Prisma Studio GUI on localhost:5555
npm run seed             # Populate database with test data
```

**Important:** Always run `npm run prisma:generate` after modifying `prisma/schema.prisma`. The project uses `postinstall` hook to auto-generate Prisma client on `npm install`.

## Architecture & Project Structure

### Spanish-First Naming Convention
This project uses **Spanish naming** for domain logic and business concepts to align with the Spanish-speaking team. Framework-standard terms (dashboard, api, layout) remain in English.

```
src/
├── app/                          # Next.js App Router
│   ├── (autenticacion)/          # Auth route group
│   │   └── iniciar-sesion/       # Login page
│   ├── (principal)/              # Main app route group
│   │   ├── dashboard/            # Dashboard & all features
│   │   │   ├── productos/        # Product management
│   │   │   ├── inventario/       # Inventory control
│   │   │   ├── envios/           # Shipment planning
│   │   │   ├── ventas/           # Point of sale
│   │   │   ├── sucursales/       # Branch management
│   │   │   └── reportes/         # Reports & analytics
│   │   └── layout.tsx            # Main layout with sidebar
│   ├── api/                      # API routes
│   │   ├── auth/[...nextauth]/   # NextAuth handler
│   │   └── sucursales/           # Branch API endpoints
│   └── no-autorizado/            # Unauthorized access page
├── caracteristicas/              # Domain logic (features)
│   ├── autenticacion/            # Auth config (auth.ts, adapter.ts)
│   ├── productos/                # Product server actions
│   ├── inventario/               # Inventory server actions
│   ├── envios/                   # Shipment server actions
│   ├── ventas/                   # Sales server actions
│   ├── sucursales/               # Branch server actions
│   └── dashboard/                # Dashboard server actions
└── compartido/                   # Shared code
    ├── componentes/              # React components
    │   ├── ui/                   # shadcn/ui components
    │   └── layout/               # Layout components (sidebar)
    ├── tipos/                    # TypeScript type definitions
    └── lib/                      # Utilities (utils.ts)

lib/
└── prisma.ts                     # Singleton Prisma client instance

prisma/
├── schema.prisma                 # Database schema
└── seed.ts                       # Seed data script

middleware.ts                     # Auth & role-based access control
```

### Path Aliases
TypeScript path aliases are configured in `tsconfig.json`:
- `@/app/*` → `src/app/*`
- `@/caracteristicas/*` → `src/caracteristicas/*`
- `@/compartido/*` → `src/compartido/*`
- `@/lib/*` → `lib/*`

Example: `import { prisma } from '@/lib/prisma'`

## Key Architectural Patterns

### Feature-Driven Organization
Each business domain (feature) is a self-contained vertical slice:

```
src/caracteristicas/productos/
  └── acciones.ts          # All product business logic

src/app/(principal)/dashboard/productos/
  ├── page.tsx             # Product list page
  ├── productos-lista.tsx  # Product list UI component
  ├── producto-form.tsx    # Product form component
  └── [id]/page.tsx        # Product edit page
```

Everything related to "productos" lives together, making it easy to locate and modify.

### Server Actions Pattern
Business logic lives in `src/caracteristicas/*/acciones.ts` files as **Server Actions** (marked with `'use server'`). These functions:
- Execute on the server (serverless)
- Handle database operations via Prisma
- Return data directly to components
- Replace traditional API controllers

Example from `src/caracteristicas/productos/acciones.ts`:
```typescript
'use server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function crearProducto(data: {...}) {
  // Validation
  if (!data.nombre) return { success: false, error: 'Nombre requerido' }

  // Database operation
  const producto = await prisma.producto.create({ data })

  // Cache revalidation
  revalidatePath('/dashboard/productos')

  return { success: true, producto }
}
```

Called from components:
```typescript
// In a Client Component
'use client'
import { crearProducto } from '@/caracteristicas/productos/acciones'

const result = await crearProducto(formData)
```

### Component Organization
- **Page components** (`page.tsx`): Server Components that fetch data and compose UI
- **Feature components** (e.g., `productos-lista.tsx`): Client Components marked with `'use client'` for interactivity
- **UI components** (`src/compartido/componentes/ui/`): Reusable shadcn/ui components

### Data Flow Pattern
1. User interacts with **Client Component** (form, button)
2. Client calls **Server Action** from `caracteristicas/*/acciones.ts`
3. Server Action validates and uses **Prisma** to query/mutate database
4. Server Action calls `revalidatePath()` to update cache
5. Server Action returns `{ success, data, error }` to client
6. Client updates UI based on response

### Database Schema Highlights
Key models in Prisma schema (`prisma/schema.prisma`):
- **Usuario** (users): Links to Role, manages authentication
- **Empresa** (company): Top-level organization
- **Sucursal** (branch): Belongs to Empresa, can have a gerente (manager)
- **Producto** (product): Has unique SKU (auto-generated)
- **Inventario** (inventory): Tracks stock per Sucursal × Producto
- **MovimientoInventario** (inventory movement): Audit trail for stock changes
- **Envio** (shipment): Transfers between sucursales
- **Venta** (sale): POS transactions with VentaItem line items
- **OperacionDiaria** (daily operation): Daily cash flow tracking per branch
- **Devolucion** (return): Product returns linked to daily operations

All database models use Spanish field names (e.g., `createdAt` → `creado_at` in DB via `@map`).

## Authentication & Authorization

### NextAuth.js Setup
- Configuration: `src/caracteristicas/autenticacion/auth.ts`
- Custom adapter: `src/caracteristicas/autenticacion/adapter.ts`
- Strategy: JWT with Credentials provider
- Login page: `/iniciar-sesion`
- Session includes: `user.id`, `user.rol`, `user.sucursalId`

### Role-Based Access Control (RBAC)
Implemented in `middleware.ts` with three roles:

1. **administrador**: Full access to all dashboard routes
2. **bodega**: Access to dashboard, inventario, envios, sucursales
3. **sucursal**: Access to dashboard, ventas, inventario, and only their own sucursal profile

Sucursal users are restricted to viewing/editing only their assigned branch (`user.sucursalId`).

## Database Connection

The project uses **Supabase** (PostgreSQL) with connection pooling:
- `DATABASE_URL`: Connection pooler URL (for Prisma migrations)
- `DIRECT_URL`: Direct connection URL (for Prisma Studio)

Prisma client is configured in `lib/prisma.ts` as a singleton to prevent multiple instances in development.

## Common Development Patterns

### Creating a New Feature
1. Add models to `prisma/schema.prisma` if needed
2. Run `npm run prisma:generate` and `npm run prisma:migrate`
3. Create server actions in `src/caracteristicas/[feature]/acciones.ts`
4. Create page at `src/app/(principal)/dashboard/[feature]/page.tsx`
5. Create UI components in the same folder (e.g., `[feature]-lista.tsx`)
6. Update middleware.ts if role-based access is needed
7. Add navigation link in `src/compartido/componentes/layout/sidebar.tsx`

### Working with Forms
Forms use `react-hook-form` + `zod` for validation. Common pattern:
```typescript
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({ ... })
const form = useForm({ resolver: zodResolver(schema) })
```

### Prisma Best Practices
- Use `new Decimal(value)` for monetary amounts (Prisma Decimal type)
- Call `revalidatePath()` after mutations to update Next.js cache
- Include related data with `include` option to avoid N+1 queries
- Use `@@unique([field1, field2])` for composite unique constraints (e.g., Inventario per sucursal × producto)

### Auto-Generated Fields
- Product SKU: Auto-generated via `generarSKU()` function in `productos/acciones.ts`
- Sucursal code: Use pattern `SUC-001`, `SUC-002` (codigoUnico field)
- IDs: Use `@default(cuid())` for string IDs, `@default(autoincrement())` for int IDs

## Environment Variables
Required in `.env`:
- `DATABASE_URL`: Supabase connection pooler URL
- `DIRECT_URL`: Supabase direct connection URL
- `NEXTAUTH_SECRET`: Secret for JWT signing
- `NEXTAUTH_URL`: Application URL (http://localhost:3000 in dev)

## Test Credentials (from seed.ts)
- **Admin**: admin@empresa.com / admin123
- **Bodega**: bodega@empresa.com / bodega123
- **Sucursal**: sucursal@empresa.com / sucursal123

Run `npm run seed` to populate test data including roles, users, empresa, sucursales, productos, and initial inventory.

## Deployment Notes
- Platform: Vercel (serverless)
- Build command: `npm run build`
- Output: `.next/` directory
- Automatic Prisma client generation via `postinstall` script
- Environment variables must be configured in Vercel dashboard

## Code Style Conventions
- **Spanish** for business domain (variables, functions, file names)
- **English** for framework terms (api, layout, middleware)
- Use descriptive Spanish names with hyphens for component files: `productos-lista.tsx`, `ventas-registro.tsx`
- Server actions return `{ success: boolean, error?: string, ...data }`
- Use `'use server'` directive for server actions
- Use `'use client'` directive sparingly, only for interactive components
