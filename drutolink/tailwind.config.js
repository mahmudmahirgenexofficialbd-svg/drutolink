/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}', './*.{js,ts,jsx,tsx}'],
  theme: { extend: { fontFamily: {
    display: ['Poppins', 'Noto Sans Bengali', 'Hind Siliguri', 'system-ui', 'sans-serif'],
    body: ['Noto Sans Bengali', 'Hind Siliguri', 'system-ui', 'sans-serif'],
  }}},
  plugins: [],
};
