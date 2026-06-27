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
        studio: {
          red: {
            DEFAULT: "#E20613",
            hover: "#C4020D",
            light: "#FEE2E2",
            border: "#FCA5A5",
          },
          black: {
            DEFAULT: "#111111",
            card: "#18181B",
            hover: "#1F1F23",
          },
          gray: {
            bg: "#F9FAFB",
            card: "#FFFFFF",
            border: "#E4E4E7",
            text: "#71717A",
            darkText: "#27272A",
            sidebar: "#111111",
            sidebarHover: "#27272A",
          },
        },
      },
    },
  },
  plugins: [],
};
export default config;
