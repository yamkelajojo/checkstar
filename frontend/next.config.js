/** @type {import('next').NextConfig} */
const nextConfig = {
  // Dev-server asset requests arrive from the Arena preview proxy origins
  // (3000-<sandbox>.e2b.app) and the device-simulator origin; allow them so
  // next dev does not warn on cross-origin _next/* requests.
  allowedDevOrigins: ["*.e2b.app"],
  images: {
    // Fallback for media that cannot be same-origin proxied. Product/store
    // images are normalised to same-origin paths via lib/media.ts; these
    // patterns just cover the common local API origins.
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      { protocol: "https", hostname: "localhost" },
      { protocol: "http", hostname: "127.0.0.1" },
      { protocol: "http", hostname: "10.0.2.2" },
    ],
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const apiBase = apiUrl.endsWith("/api")
      ? apiUrl.replace(/\/api$/, "")
      : apiUrl;
    return [
      {
        source: "/api/:path*",
        destination: `${apiBase}/api/:path*`,
      },
      {
        source: "/sanctum/:path*",
        destination: `${apiBase}/sanctum/:path*`,
      },
      {
        // Media lives under /products/** on the API — but ONLY match real
        // image files. Without the extension guard this rewrite would sit in
        // front of the product detail route for every /products/<slug> URL
        // (afterFiles rewrites run before dynamic routes) and product pages
        // would be served the API's image fallback instead of HTML.
        source: "/products/:cat/:file(.+\\.(?:png|jpe?g|webp|svg|gif|avif))",
        destination: `${apiBase}/products/:cat/:file`,
      },
      {
        // Media stored directly under products/ (no category segment).
        source: "/products/:file(.+\\.(?:png|jpe?g|webp|svg|gif|avif))",
        destination: `${apiBase}/products/:file`,
      },
      {
        source: "/recipes/:file(.+\\.(?:png|jpe?g|webp|svg|gif|avif))",
        destination: `${apiBase}/recipes/:file`,
      },
    ];
  },
};
module.exports = nextConfig;
