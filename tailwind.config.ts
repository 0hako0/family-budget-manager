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
        cream: "#fbf7ee",
        ink: "#22312f",
        leaf: "#2f8f6b",
        sky: "#2d7dd2",
        warn: "#d94a45"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(34, 49, 47, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
