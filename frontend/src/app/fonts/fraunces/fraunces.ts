import localFont from "next/font/local"

// Self-hosted Fraunces (variable serif) — used for premium display type
// (e.g. Atelier category cards). Vendored from Google Fonts.
export const fraunces = localFont({
  src: [
    { path: "./files/fraunces-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./files/fraunces-latin-400-normal.woff2", weight: "500", style: "normal" },
    { path: "./files/fraunces-latin-400-normal.woff2", weight: "600", style: "normal" },
    { path: "./files/fraunces-latin-400-normal.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
  variable: "--font-fraunces",
})
