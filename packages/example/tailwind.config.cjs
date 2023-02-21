/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{vue,js,ts,jsx,tsx}", "./index.html"],
  theme: {
    extend: {},
  },
  plugins: [
    require("tailwindcss-themer")({
      defaultTheme: {
        extend: {
          colors: {
            primary: "#4CCBA0",
            secondary: "#0E1731",
          },
          borderRadius: {
            base: "4px",
          },
        },
      },
      themes: [
        {
          name: "theme-dark",
          extend: {
            colors: {
              primary: "black",
              secondary: "#0E1731",
            },
            borderRadius: {
              base: "2px",
            },
          },
        },
      ],
    }),
  ],
};
