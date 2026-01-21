/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // "Crimson" Premium Dark Theme Palette
        bg: {
          main: '#0E0E10',      // Deepest background (Main Canvas)
          panel: '#151518',     // Panel background (Sidebars)
          header: '#121214',    // Top/Bottom bars
          hover: '#222226',     // Interactive hover
        },
        accent: {
          primary: '#FF4D4D',   // Crimson Red (Active/Highlight)
          secondary: '#FF8E3C', // Solar Orange (Knobs/Meters)
          success: '#10b981',   // Green
          warning: '#f59e0b',   // Orange
          danger: '#FF0000',    // Bright Red (Record)
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#A1A1AA',
          muted: '#52525B',
        },
        border: {
          subtle: '#222226',
          focus: '#FF4D4D',
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
