import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        // ScholarAI palette
        bg: "#0F0F1A",
        card: "#1A1A2E",
        cardElevated: "#22223F",
        border: "#2A2A45",
        muted: "#9CA3B5",
        primary: {
          DEFAULT: "#6C63FF",
          fg: "#FFFFFF",
          soft: "#8B83FF",
          ring: "rgba(108, 99, 255, 0.45)",
        },
        accent: "#22D3EE",
        success: "#34D399",
        danger: "#F87171",
        warning: "#FBBF24",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      keyframes: {
        "flip-in": {
          "0%": { transform: "rotateY(0deg)" },
          "100%": { transform: "rotateY(180deg)" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(1)", opacity: "0.7" },
          "100%": { transform: "scale(2.4)", opacity: "0" },
        },
      },
      animation: {
        "flip-in": "flip-in 350ms ease-out forwards",
        "fade-in": "fade-in 200ms ease-out",
        shimmer: "shimmer 2.5s linear infinite",
        "pulse-ring": "pulse-ring 1.4s cubic-bezier(0.4,0,0.6,1) infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
