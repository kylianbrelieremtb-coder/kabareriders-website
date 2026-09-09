/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx}",
    "./src/components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Charte graphique KabaRider
        ocre: "#C76520",
        vert: "#C2A833",
        marron: "#704916",
        beige: "#EFE6CE",
      },
      fontFamily: {
        // Titres : Squada One / Texte : Futura (avec substitut libre Jost)
        title: ["var(--font-squada)", "Squada One", "cursive"],
        body: ["Futura", "var(--font-jost)", "Jost", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
