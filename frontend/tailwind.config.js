/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eef2ff",
          100: "#e0e7ff",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
        },
      },
      fontFamily: {
        sans: ["'Inter'", "sans-serif"],
        display: ["'Playfair Display'", "serif"],
      },
      keyframes: {
        "fade-in":    { from: { opacity: "0" } },
        "zoom-in-95": { from: { opacity: "0", transform: "scale(.95)" } },
        "slide-up":   { from: { opacity: "0", transform: "translateY(8px)" } },
      },
      animation: {
        "in":           "fade-in 0.15s ease-out",
        "zoom-in-95":   "zoom-in-95 0.15s ease-out",
        "slide-up":     "slide-up 0.2s ease-out",
      },
    },
  },
  plugins: [],
};
