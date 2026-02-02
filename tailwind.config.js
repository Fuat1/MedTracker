/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bp: {
          normal: '#22c55e', // Green
          elevated: '#eab308', // Yellow
          stage1: '#f97316', // Orange
          stage2: '#ef4444', // Red
          crisis: '#dc2626', // Dark Red
        },
      },
    },
  },
  plugins: [],
};
