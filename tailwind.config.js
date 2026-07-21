/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#183A72',
          primaryDark: '#102A54',
          primarySoft: '#EAF1FF',
          accent: '#D4AF37',
          accentSoft: '#FFF7D8',
          background: '#F7F9FC',
          card: '#FFFFFF',
          border: '#E5E7EB',
          text: '#111827',
          muted: '#6B7280',
          success: '#16A34A',
          warning: '#F59E0B',
          danger: '#DC2626',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        enterprise: '0 1px 2px rgba(17, 24, 39, 0.05), 0 12px 28px rgba(17, 24, 39, 0.06)',
        'enterprise-soft': '0 1px 2px rgba(17, 24, 39, 0.05)',
      },
    },
  },
  plugins: [],
};
