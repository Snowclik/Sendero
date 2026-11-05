/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        solar: {
          sky: '#0284c7',       // sky-600
          amber: '#f59e0b',     // amber-500
          emerald: '#059669',   // emerald-600
          indigo: '#4f46e5',    // indigo-600
          rose: '#f43f5e',      // rose-500
        },
      },
      boxShadow: {
        'glass-card': '0 12px 40px rgba(14, 116, 144, 0.08), inset 0 2px 2px rgba(255, 255, 255, 1)',
        'glass-button': '0 6px 20px rgba(14, 116, 144, 0.06), inset 0 1px 1px rgba(255, 255, 255, 0.8)',
        'glass-glow': '0 0 25px rgba(56, 189, 248, 0.35)',
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Ubuntu',
          'Cantarell',
          'sans-serif',
        ],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'breathe': 'breathe 4s ease-in-out infinite',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.15)' },
        },
      },
    },
  },
  plugins: [],
};

