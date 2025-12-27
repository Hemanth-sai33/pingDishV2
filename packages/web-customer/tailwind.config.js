/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#f97316",
        primaryHover: "#ea580c",
        secondary: "#1e293b",
        cream: "#fffbf5"
      }
    }
  },
  plugins: []
};
