/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1E3A8A",
        secondary: "#60A5FA",
        background: "#F5F5F5",
        white: "#FFF",
        black: "#000",
        gray: "#6B7280",
        border: "#DDD",
        warning: "#FF3B30",
        success: "#10B981",
        error: "#EF4444",
        transparent: "transparent",
      },
      fontSize: {
        title: "12px",
        subtitle: "16px",
        body: "14px",
        small: "12px",
      },
      fontFamily: {
        roboto: ["Roboto-Regular", "sans-serif"],
        "roboto-bold": ["Roboto-Bold", "sans-serif"],
        "roboto-medium": ["Roboto-Medium", "sans-serif"],
      },
    },
  },
  plugins: [],
};