/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        nunito: ['Nunito-Regular'],
        'nunito-medium': ['Nunito-Medium'],
        'nunito-semibold': ['Nunito-SemiBold'],
        'nunito-bold': ['Nunito-Bold'],
        'nunito-extrabold': ['Nunito-ExtraBold'],
      },
      borderRadius: {
        'card-sm': '8px',
        card: '12px',
        'card-lg': '16px',
      },
      spacing: {
        'card-sm': '8px',
        'card-md': '16px',
        'card-lg': '20px',
      },
    },
  },
  plugins: [],
};
