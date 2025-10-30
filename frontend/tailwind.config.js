/** @type {import('tailwindcss').Config} */
export default {
  content: [
  "./index.html",
  "./src/**/*.{js,jsx,ts,tsx}",
],
  theme: {
    extend: {colors: {
        'pong-green': '#00ff00',
        'pong-dark': '#0a0a0a',
        'pong-gray': '#1a1a1a',
      },
    },
  },
  plugins: [],
}

