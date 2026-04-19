/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        chocolate: { 50:'#fdf6f0',100:'#f9e8d5',200:'#f0c89e',300:'#e5a168',400:'#d97b3a',500:'#c4621d',600:'#a84d15',700:'#8a3c12',800:'#6F4F37',900:'#4a2f1f' },
        mocha: { 50:'#f5f3f0',100:'#e8e2d9',200:'#d1c4b0',300:'#b5a082',400:'#9a7e5a',500:'#7d6243',600:'#664f35',700:'#4e3c28',800:'#3a2c1e',900:'#261c12' },
        cream: { 50:'#fffdf9',100:'#fef8ee',200:'#fdf0d5',300:'#fae3ad',400:'#f5cf77',500:'#f0b83d',600:'#e09a1a',700:'#b87a12',800:'#8f5c0d',900:'#5c3a09' },
        sage: { 50:'#f2f5ef',100:'#e0e9d7',200:'#bdd4ae',300:'#96b97e',400:'#6e9d4f','500':'#556B2F',600:'#44562a',700:'#354223',800:'#26301a',900:'#181f10' },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'count-up': 'countUp 0.8s ease-out',
      },
      keyframes: {
        fadeIn: { from:{ opacity:'0' }, to:{ opacity:'1' } },
        slideUp: { from:{ opacity:'0', transform:'translateY(20px)' }, to:{ opacity:'1', transform:'translateY(0)' } },
        slideInRight: { from:{ opacity:'0', transform:'translateX(20px)' }, to:{ opacity:'1', transform:'translateX(0)' } },
        pulseSoft: { '0%,100%':{ opacity:'1' }, '50%':{ opacity:'0.7' } },
        countUp: { from:{ opacity:'0', transform:'translateY(10px)' }, to:{ opacity:'1', transform:'translateY(0)' } },
      },
      boxShadow: {
        'warm': '0 4px 24px rgba(111,79,55,0.15)',
        'warm-lg': '0 8px 48px rgba(111,79,55,0.2)',
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08), 0 12px 32px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
}
