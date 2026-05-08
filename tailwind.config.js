/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#09090b",
        foreground: "#fafafa",
        card: "#18181b",
        "card-foreground": "#fafafa",
        primary: "#6366f1",
        "primary-foreground": "#ffffff",
        muted: "#71717a",
        "muted-foreground": "#a1a1aa",
        border: "#27272a",
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