/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#578FCA",
        "primary-hover": "#4B7AAE",
        card: "#FFFFFF",
        border: "#E2E8F0",
        error: "#DC2626",
        success: "#059669",
        "primary-light": "#A1E3F9",
      },
    },
  },
  plugins: [],
};
