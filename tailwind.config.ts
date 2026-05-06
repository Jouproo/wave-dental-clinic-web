import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eff8ff",
          100: "#dbeefe",
          200: "#bfe0fd",
          300: "#92ccfb",
          400: "#5eb1f7",
          500: "#3892f3",
          600: "#2272e8",
          700: "#1a5bd5",
          800: "#1c4aac",
          900: "#1c4088",
          950: "#152852",
        },
        teal: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
        },
      },
    },
  },
  plugins: [],
};

export default config;
