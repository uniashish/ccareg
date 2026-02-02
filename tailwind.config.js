/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#00A9A9", // Teal
          secondary: "#EA3722", // Red
          neutral: "#F49119", // Orange
        },
      },
    },
  },
  plugins: [],
};
