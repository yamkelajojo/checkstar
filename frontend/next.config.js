/** @type {import('next').NextConfig} */
const nextConfig = {
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
    ]
  },
}
module.exports = nextConfig
