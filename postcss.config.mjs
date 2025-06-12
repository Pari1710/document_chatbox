/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}, // Add autoprefixer to handle vendor prefixes
  },
};

export default config;
