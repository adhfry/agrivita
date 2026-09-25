/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,ts}"],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1rem", sm: "1.5rem", lg: "2rem" },
      screens: { xl: "1200px" },
    },
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
      },
      colors: {
        // Diambil dari logo Agrivita
        brand: {
          blue: "#0B6FC4",
          green: "#2FA84F",
          lime: "#8CD43F",
          forest: "#0A6B4F",
          sun: "#F9C22E",
        },
        ink: "#0E1A14",
        muted: "#55665D",
        line: "#E3EAE5",
        soft: "#F4F8F3",
      },
    },
  },
  plugins: [],
};
