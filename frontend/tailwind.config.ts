import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-space)", "sans-serif"],
        body:    ["var(--font-dm)",    "sans-serif"],
      },
      colors: {
        night:   "#0f1117",
        void:    "#080a0f",
        panel:   "#141820",
        rim:     "#1e2433",
        divider: "#252d3d",
        teal:    { DEFAULT: "#00d4aa", dim: "#00a882", glow: "rgba(0,212,170,0.15)" },
        ink:     { DEFAULT: "#e2e8f0", muted: "#7a8399", faint: "#3a4258" },
        danger:  "#e05c5c",
      },
      animation: {
        "pulse-teal": "pulse-teal 1.4s ease-in-out infinite",
        "fade-up":    "fade-up 0.3s ease both",
        "slide-in":   "slide-in 0.25s ease both",
      },
      keyframes: {
        "pulse-teal": {
          "0%,100%": { boxShadow: "0 0 0 0 rgba(0,212,170,0.5)" },
          "50%":      { boxShadow: "0 0 0 8px rgba(0,212,170,0)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          from: { opacity: "0", transform: "translateX(-8px)" },
          to:   { opacity: "1", transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
