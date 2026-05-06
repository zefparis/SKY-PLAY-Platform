/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // SKY PLAY palette (source of truth)
        brand: {
          primary: '#00165F', // Dark Blue
          secondary: '#0097FC', // Electric Blue (CTA)
          accent: '#FD2E5F', // Red (alerts/accent)
          white: '#FFFFFF',
          black: '#000000',
        },
        // Alias tokens used by the app (keep names explicit & brand-bound)
        primary: '#00165F',
        secondary: '#0097FC',
        accent: '#FD2E5F',
        white: '#FFFFFF',
        black: '#000000',
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
        // Titles: futuristic / techno style. We keep a dedicated slot.
        // The actual font file can be added later; fallback keeps it production-safe.
        display: ['var(--font-display)', 'Montserrat', 'sans-serif'],
      },
      boxShadow: {
        // Glow effects (soft neon)
        'glow-blue': '0 0 24px rgba(0, 151, 252, 0.45)',
        'glow-red': '0 0 24px rgba(253, 46, 95, 0.40)',
        // Depth (shadows + blur feel)
        'depth-1': '0 10px 30px rgba(0, 0, 0, 0.35)',
        'depth-2': '0 18px 60px rgba(0, 0, 0, 0.45)',
      },
      borderRadius: {
        // Rounded cards (not too soft)
        md: '0.75rem',
        lg: '1rem',
      },
      keyframes: {
        fadeSlideIn: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-slide-in': 'fadeSlideIn 0.3s ease-out',
        'fade-in-down': 'fadeInDown 0.2s ease-out',
      },
    },
  },
  plugins: [],
}
