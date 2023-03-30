/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{vue,js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      animation: {
        breath: "breath 1s ease-in-out infinite",
      },
      keyframes: {
        breath: {
          "0%": { transform: "scale(1)", opacity: 0.8 },
          "50%": { transform: "scale(1.02)", opacity: 1 },
          "100%": { transform: "scale(1)", opacity: 0.8 },
        },
      },
    },
  },
  plugins: [
    require("tailwindcss-themer")({
      defaultTheme: {
        extend: {},
      },
      themes: [
        {
          name: "theme-dark",
          extend: {},
        },
      ],
    }),
  ],
};
