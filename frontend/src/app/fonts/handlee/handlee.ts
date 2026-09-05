import localFont from "next/font/local"

// Self-hosted Handlee (vendored from @fontsource/handlee) so builds are
// hermetic — next/font/google fetches from Google at build time.
export const handlee = localFont({
  src: [
    { path: "./files/handlee-latin-400-normal.woff2", weight: "400", style: "normal" },
  ],
  display: "swap",
  variable: "--font-handlee",
})
