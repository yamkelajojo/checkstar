/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Fallback for media that cannot be same-origin proxied. Product/store
    // images are normalised to same-origin paths via lib/media.ts; these
    // patterns just cover the common local API origins.
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'localhost' },
      { protocol: 'http', hostname: '127.0.0.1' },
      { protocol: 'http', hostname: '10.0.2.2' },
    ],
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const apiBase = apiUrl.endsWith('/api') ? apiUrl.replace(/\/api$/, '') : apiUrl
    return [
      {
        source: '/api/:path*',
        destination: `${apiBase}/api/:path*`,
      },
      {
        source: '/sanctum/:path*',
        destination: `${apiBase}/sanctum/:path*`,
      },
      {
        source: '/products/:cat/:file',
        destination: `${apiBase}/products/:cat/:file`,
      },
      {
        // Media stored directly under products/ (no category segment).
        source: '/products/:file',
        destination: `${apiBase}/products/:file`,
      },
    ]
  },
}
module.exports = nextConfig
