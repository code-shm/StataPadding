import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#05060c",
          900: "#0a0c16",
          800: "#111426",
          700: "#1a1f38",
          600: "#262c4d",
          500: "#3a4270",
        },
        home: {
          DEFAULT: "#22d3ee", // cyan — player A
          soft: "rgba(34,211,238,0.15)",
        },
        away: {
          DEFAULT: "#f0559b", // magenta — player B
          soft: "rgba(240,85,155,0.15)",
        },
        gold: "#ffd75e",
      },
      fontFamily: {
        display: ['"Segoe UI"', "system-ui", "-apple-system", "sans-serif"],
        sans: ['"Segoe UI"', "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(34,211,238,0.5)",
        card: "0 20px 60px -20px rgba(0,0,0,0.7)",
      },
      backgroundImage: {
        "grid-fade":
          "radial-gradient(circle at 50% 0%, rgba(58,66,112,0.35), transparent 60%)",
      },
      keyframes: {
        "fill-bar": {
          from: { transform: "scaleX(0)" },
          to: { transform: "scaleX(1)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pop-in": {
          "0%": { opacity: "0", transform: "scale(0.94)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fill-bar": "fill-bar 0.9s cubic-bezier(0.22,1,0.36,1) forwards",
        "fade-up": "fade-up 0.5s ease-out forwards",
        "pop-in": "pop-in 0.4s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
