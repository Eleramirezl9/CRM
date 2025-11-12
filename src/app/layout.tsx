import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from './providers'
import PWARegistration from '@/compartido/componentes/pwa/PWARegistration'
import ServiceWorkerCleaner from '@/compartido/componentes/pwa/ServiceWorkerCleaner'

export const metadata: Metadata = {
  title: 'Nuestro Pan',
  description: 'Sistema de gestión empresarial multi-sucursal con control de inventario, ventas y producción',
  applicationName: 'Nuestro Pan',
  authors: [{ name: 'Tu Empresa' }],
  generator: 'Next.js',
  keywords: ['gestión', 'inventario', 'ventas', 'producción', 'multi-sucursal', 'panadería'],
  referrer: 'origin-when-cross-origin',
  creator: 'Tu Empresa',
  publisher: 'Tu Empresa',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Nuestro Pan',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icons/manifest-icon-192.maskable.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/manifest-icon-512.maskable.png', sizes: '512x512', type: 'image/png' },
      { url: '/icons/favicon-196.png', sizes: '196x196', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-icon-180.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    type: 'website',
    siteName: 'Nuestro Pan',
    title: 'Nuestro Pan',
    description: 'Sistema de gestión empresarial multi-sucursal con control de inventario, ventas y producción',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Nuestro Pan',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nuestro Pan',
    description: 'Sistema de gestión empresarial multi-sucursal',
    images: ['/og-image.png'],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#c86d3d' },
    { media: '(prefers-color-scheme: dark)', color: '#c86d3d' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta name="application-name" content="CRM Multi-Sucursal" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CRM" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#c86d3d" />
        <meta name="msapplication-tap-highlight" content="no" />
        <link rel="apple-touch-icon" href="/icons/apple-icon-180.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/manifest-icon-192.maskable.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/manifest-icon-192.maskable.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="mask-icon" href="/icons/icon.svg" color="#c86d3d" />
        <link rel="shortcut icon" href="/favicon.ico" />
      </head>
      <body suppressHydrationWarning>
        <ServiceWorkerCleaner />
        <PWARegistration />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
