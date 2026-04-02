import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "var(--color-ink)",
        blush: "var(--color-blush)",
        gold: "var(--color-gold)",
        mist: "var(--color-mist)",
        night: "var(--color-night)"
      },
      backgroundImage: {
        "hero-haze":
          "radial-gradient(circle at top, rgba(255,255,255,0.55), transparent 42%), linear-gradient(135deg, rgba(255,255,255,0.18), transparent 60%)"
      },
      boxShadow: {
        glow: "0 24px 80px rgba(12, 18, 38, 0.18)"
      }
    }
  },
  plugins: []
};

export default config;
