import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#29251f",
        cream: "#f7f4ee",
        olive: "#535942",
        muted: "#76746c",
      },
    },
  },
  plugins: [],
} satisfies Config;
