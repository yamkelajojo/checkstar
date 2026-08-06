/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
      {
        source: '/products/:cat/:file',
        destination: 'http://localhost:8000/products/:cat/:file',
      },
    ]
  },
}
module.exports = nextConfig
