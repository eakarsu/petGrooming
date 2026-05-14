/** @type {import('next').NextConfig} */
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

const nextConfig = {
  images: {
    domains: ['localhost', 'images.unsplash.com', 'res.cloudinary.com'],
  },
  experimental: {
    serverActions: {
      allowedOrigins: allowedOrigins.length ? allowedOrigins : ['localhost:3000'],
    },
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      {
        source: '/api/:path*',
        headers: [
          ...securityHeaders,
          { key: 'Access-Control-Allow-Origin', value: allowedOrigins.length === 1 ? allowedOrigins[0] : '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,PATCH,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, x-cron-secret' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
