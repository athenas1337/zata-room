import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        makima: {
          crimson: "#e11d48",
          red: "#be123c",
          darkred: "#881337",
          blood: "#9f1239",
          gold: "#f59e0b",
          amber: "#fbbf24",
          obsidian: "#070409",
          noir: "#0d0611",
          card: "#120917",
          border: "#281220",
          glow: "rgba(225, 29, 72, 0.35)",
        },
        agent: {
          blue: "#3b82f6",
          emerald: "#10b981",
          purple: "#8b5cf6",
          amber: "#f59e0b",
          rose: "#f43f5e",
        },
      },
      keyframes: {
        "jedag-jedug": {
          "0%, 100%": {
            transform: "scale(1)",
            filter: "drop-shadow(0 0 8px rgba(225, 29, 72, 0.4))",
          },
          "50%": {
            transform: "scale(1.05)",
            filter: "drop-shadow(0 0 20px rgba(225, 29, 72, 0.9)) drop-shadow(0 0 35px rgba(245, 158, 11, 0.6))",
          },
        },
        "eye-glow": {
          "0%, 100%": {
            opacity: "0.85",
            filter: "drop-shadow(0 0 4px #fbbf24)",
          },
          "50%": {
            opacity: "1",
            filter: "drop-shadow(0 0 12px #f59e0b) drop-shadow(0 0 20px #e11d48)",
          },
        },
      },
      animation: {
        "jedag-jedug": "jedag-jedug 1.1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "eye-glow": "eye-glow 2.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
