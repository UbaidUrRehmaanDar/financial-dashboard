/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background:        'var(--color-background)',
        foreground:        'var(--color-foreground)',
        card:              'var(--color-card)',
        'card-foreground': 'var(--color-card-foreground)',
        primary:           'var(--color-primary)',
        'primary-foreground': 'var(--color-primary-foreground)',
        muted:             'var(--color-muted)',
        'muted-foreground':'var(--color-muted-foreground)',
        border:            'var(--color-border)',
      },
      borderRadius: { lg: "0.5rem", md: "0.375rem", sm: "0.25rem" },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    }
  },
  plugins: []
}