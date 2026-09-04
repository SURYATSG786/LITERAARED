/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["Space Grotesk", "Noto Sans", "sans-serif"],
        body: ["Nunito", "Noto Sans", "sans-serif"],
        hi: ["Noto Sans Devanagari", "Noto Sans", "Nunito", "sans-serif"],
        ta: ["Noto Sans Tamil", "Noto Sans", "Nunito", "sans-serif"],
        te: ["Noto Sans Telugu", "Noto Sans", "Nunito", "sans-serif"],
        kn: ["Noto Sans Kannada", "Noto Sans", "Nunito", "sans-serif"],
        ml: ["Noto Sans Malayalam", "Noto Sans", "Nunito", "sans-serif"],
      },
      colors: {
        'duo-green': '#2e9e44',
        'duo-green-dark': '#1f7a33',
        'duo-blue': '#0b6fb8',
        'duo-red': '#d64545',
        'duo-gold': '#cf8a00',
      },
    },
  },
  plugins: [],
}
