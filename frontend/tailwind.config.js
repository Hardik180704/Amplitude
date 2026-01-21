/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // "Aurora" Dark Theme Palette
        bg: {
          main: '#121214',      // Deepest background
          panel: '#1E1E24',     // Panel background
          header: '#18181B',    // Top/Bottom bars
          hover: '#272730',     // Interactive hover
        },
        accent: {
          primary: '#00afdb',   // Electric Blue (Active state)
          secondary: '#7c3aed', // Purple (Accents)
          success: '#10b981',   // Green (Meters)
          warning: '#f59e0b',   // Orange (Clipping)
          danger: '#ef4444',    // Red (Record)
        },
        text: {
          primary: '#E4E4E5',
          secondary: '#A1A1AA',
          muted: '#52525B',
        },
        border: {
          subtle: '#2a2a35',
          focus: '#3f3f4e',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'], // Good for time/code
      },
      boxShadow: {
        'glow': '0 0 10px rgba(0, 175, 219, 0.3)',
        'panel': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.15)',
      }
    },
  },
  plugins: [],
}
