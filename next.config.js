/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
    serverComponentsExternalPackages: ['@node-rs/argon2'],
  },
  // Optimizaciones de rendimiento
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Mejorar tiempos de carga
  poweredByHeader: false,
  // Excluir módulos nativos de Node.js del bundle del cliente
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Marcar argon2 como externo para evitar bundling en cliente
      config.externals = config.externals || []
      config.externals.push({
        '@node-rs/argon2': 'commonjs @node-rs/argon2',
      })

      // También usar resolve.alias como fallback
      config.resolve.alias = {
        ...config.resolve.alias,
        '@node-rs/argon2': false,
        '@node-rs/argon2-win32-x64-msvc': false,
        '@node-rs/argon2-darwin-x64': false,
        '@node-rs/argon2-darwin-arm64': false,
        '@node-rs/argon2-linux-x64-gnu': false,
        '@node-rs/argon2-linux-x64-musl': false,
        '@node-rs/argon2-linux-arm64-gnu': false,
        '@node-rs/argon2-linux-arm64-musl': false,
      }
    }
    return config
  },
}

module.exports = nextConfig
