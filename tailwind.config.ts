import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Semantic theme tokens (CSS variables)
        th: {
          base: "var(--th-base)",
          surface: "var(--th-surface)",
          elevated: "var(--th-elevated)",
          subtle: "var(--th-subtle)",
          hover: "var(--th-hover)",
          medium: "var(--th-medium)",
          strong: "var(--th-strong)",
          border: "var(--th-border)",
          "border-em": "var(--th-border-em)",
          "border-muted": "var(--th-border-muted)",
          ink: "var(--th-ink)",
          "ink-2": "var(--th-ink-2)",
          "ink-3": "var(--th-ink-3)",
          "ink-4": "var(--th-ink-4)",
          glass: "var(--th-glass)",
          "glass-strong": "var(--th-glass-strong)",
          overlay: "var(--th-overlay)",
        },
        midnight: {
          950: "#06080F",
          900: "#0B0F19",
          800: "#111827",
          700: "#1A2035",
          600: "#1F2937",
          500: "#374151",
        },
      },
      fontFamily: {
        heading: ["var(--font-sora)", "system-ui", "sans-serif"],
        body: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
      },
      animation: {
        "slide-up": "slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-in-right":
          "slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-in": "fadeIn 0.25s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
      },
      keyframes: {
        slideUp: {
          "0%": { transform: "translateY(100%)", opacity: "0.5" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideInRight: {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
