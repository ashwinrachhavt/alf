import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#ffffff",
          dark: "#0a0a0a",
        },
        fg: {
          DEFAULT: "#0a0a0a",
          dark: "#f5f5f5",
        },
        muted: {
          DEFAULT: "#f4f4f5",
          dark: "#111113",
        }
      },
      boxShadow: {
        subtle: "0 1px 2px rgba(0,0,0,0.06)",
        soft: "0 2px 8px rgba(0,0,0,0.08)",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica", "Arial", "Noto Sans", "sans-serif", "Apple Color Emoji", "Segoe UI Emoji"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", "monospace"],
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
