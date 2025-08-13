/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-roboto)', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['var(--font-roboto-mono)', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}