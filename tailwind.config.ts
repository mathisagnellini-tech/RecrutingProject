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
        navy: {
          50: "#e8ecf4",
          100: "#c5cedf",
          200: "#8ea0c5",
          300: "#5772ab",
          400: "#364d7a",
          500: "#1a2744",
          600: "#152038",
          700: "#10192c",
          800: "#0b1120",
          900: "#060914",
        },
        burgundy: {
          50: "#fce8ec",
          100: "#f5bcc8",
          200: "#e87890",
          300: "#c93a5a",
          400: "#aa2040",
          500: "#8B1A2B",
          600: "#751624",
          700: "#5f121d",
          800: "#490e16",
          900: "#330a0f",
        },
      },
    },
  },
  plugins: [],
};
export default config;
