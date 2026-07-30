import type { Config } from "tailwindcss"
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#EB6522', dark: '#CC4400', light: '#FFE0CC' },
        accent: '#CC0000',
        success: '#2D6A4F',
        warning: '#E9C46A',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Figtree', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
