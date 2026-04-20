import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        kawaii: {
          pink: '#FF6B9D',
          'pink-light': '#FFB8D0',
          purple: '#C084FC',
          'purple-light': '#E0CBFF',
          mint: '#6EE7B7',
          'mint-light': '#B8F5DC',
          yellow: '#FDE68A',
          'yellow-light': '#FEF3C7',
          cream: '#FFFBF5',
          blush: '#FFF0F5',
          text: '#4A4458',
          'text-light': '#706A82',
          card: '#FFFFFF',
          danger: '#FF8FA3',
          'danger-light': '#FFD6DE',
        },
      },
      borderRadius: {
        kawaii: '20px',
        'kawaii-sm': '14px',
        'kawaii-lg': '28px',
        pill: '9999px',
      },
      boxShadow: {
        kawaii: '0 4px 20px rgba(255, 107, 157, 0.12)',
        'kawaii-hover': '0 8px 30px rgba(255, 107, 157, 0.2)',
        'kawaii-card': '0 2px 12px rgba(74, 68, 88, 0.06)',
        'kawaii-card-hover': '0 6px 24px rgba(74, 68, 88, 0.1)',
      },
      fontFamily: {
        kawaii: ['Nunito', 'system-ui', 'sans-serif'],
      },
      animation: {
        'bounce-soft': 'bounce-soft 0.3s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'pop-in': 'pop-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        wiggle: 'wiggle 0.5s ease-in-out',
        float: 'float 3s ease-in-out infinite',
      },
      keyframes: {
        'bounce-soft': {
          '0%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
          '100%': { transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-3deg)' },
          '75%': { transform: 'rotate(3deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
