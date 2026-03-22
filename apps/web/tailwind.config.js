/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#00165F',
        secondary: '#0097FC',
        accent: '#FD2E5F',
        background: '#0A0F2A',
        dark: {
          100: '#1A1F3A',
          200: '#151A30',
          300: '#0F1426',
        }
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
      },
      boxShadow: {
        'neon-blue': '0 0 20px rgba(0, 151, 252, 0.5)',
        'neon-red': '0 0 20px rgba(253, 46, 95, 0.5)',
      },
    },
  },
  plugins: [],
}
