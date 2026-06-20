import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        "black-pearl": "#050816",
        violet: "#7C3AED",
        aqua: "#06B6D4",
        "ice-white": "#F9FAFB",
        magenta: "#D946EF",
        emerald: "#10B981",
        "blue-glow": "#2563EB"
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        heading: ["Sora", "Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"]
      },
      boxShadow: {
        glow: "0 0 60px rgba(6, 182, 212, 0.24)"
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at top, rgba(37, 99, 235, 0.18), transparent 40%), linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)"
      },
      backgroundSize: {
        grid: "100% 100%, 48px 48px, 48px 48px"
      }
    }
  },
  plugins: []
};

export default config;
