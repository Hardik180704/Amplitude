/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          bg: {
            main: '#0a0e17',      // Darker, bluer background (Sapphire Deep)
            panel: '#111625',     // Slightly lighter panel
            header: '#161b2e',
            hover: '#1e263d',
            glass: 'rgba(17, 22, 37, 0.7)',
          },
          text: {
            primary: '#e2e8f0',   // Slate 200
            secondary: '#94a3b8', // Slate 400
            muted: '#64748b',     // Slate 500
          },
          accent: {
            primary: '#3b82f6',   // Blue 500 (Sapphire Neon)
            secondary: '#6366f1', // Indigo 500
            success: '#10b981',
            warning: '#f59e0b',
            danger: '#ef4444',
          },
          border: {
             DEFAULT: 'rgba(255, 255, 255, 0.08)',
             subtle: 'rgba(255, 255, 255, 0.04)',
             active: 'rgba(59, 130, 246, 0.5)',
          }
        },
        boxShadow: {
            'glow-sm': '0 0 10px rgba(59, 130, 246, 0.3)',
            'glow-md': '0 0 20px rgba(59, 130, 246, 0.4)',
            'panel': '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
        },
        fontFamily: {
             mono: ['JetBrains Mono', 'Menlo', 'monospace'],
             sans: ['Inter', 'system-ui', 'sans-serif'],
        }
      },
    },
    plugins: [],
  }
