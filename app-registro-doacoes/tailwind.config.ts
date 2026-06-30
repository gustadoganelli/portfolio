import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Paleta de marca (verde) + neutros. Troque pela identidade do seu projeto.
        marca: {
          50: "#eefbf3",
          100: "#d6f5e0",
          500: "#16a34a",
          600: "#15803d",
          700: "#166534",
        },
      },
    },
  },
  plugins: [],
};

export default config;
