import type { Config } from "tailwindcss"
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Intent: primary = orange (brand action), accent/danger = true red.
        // Previous accent #CC0000 and primary-dark #CC4400 were visually
        // identical dark reds — a manager scanning admin could not tell a
        // primary hover from a destructive button. Now they are distinct:
        // orange stays orange, red stays red.
        primary: { DEFAULT: '#EB6522', dark: '#C2410C', light: '#FFE0CC' },
        accent: { DEFAULT: '#DC2626', dark: '#991B1B', light: '#FEE2E2' },
        success: '#2D6A4F',
        warning: '#FBBF24',
        surface: '#FFFCF9',
        foreground: '#1B1816',
        border: '#E6DFD6',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-handlee)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
        accent: ['var(--font-handlee)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-fraunces)', 'Georgia', 'serif'],
      },
      borderRadius: {
        sm: '10px',
        button: '12px',
        card: '16px',
        xl: '20px',
        pill: '9999px',
      },
    },
  },
  plugins: [],
}
export default config
