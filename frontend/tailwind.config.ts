import type { Config } from "tailwindcss"
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#EB6522', dark: '#CC4400', light: '#FFE0CC' },
        accent: '#CC0000',
        success: '#2D6A4F',
        warning: '#FBBF24',
        surface: '#FFFCF9',
        foreground: '#1B1816',
        border: '#E6DFD6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Handlee', 'Figtree', 'system-ui', 'sans-serif'],
        accent: ['Handlee', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
