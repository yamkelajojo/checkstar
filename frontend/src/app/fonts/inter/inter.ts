import localFont from "next/font/local"

// Self-hosted Inter (vendored from @fontsource/inter) so builds are hermetic —
// next/font/google fetches from Google at build time and fails offline.
export const inter = localFont({
  src: [
    { path: "./files/inter-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./files/inter-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "./files/inter-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "./files/inter-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
  variable: "--font-inter",
})
