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
          main: '#09090b',      // Zinc-950 (Main Canvas) - deeper
          panel: '#121215',     // Zinc-900ish (Sidebars)
          header: '#18181b',    // Zinc-900 (Top/Bottom bars)
          hover: '#27272a',     // Zinc-800
          active: '#3f3f46',    // Zinc-700
          glass: 'rgba(24, 24, 27, 0.6)', // Glass effect base
        },
        accent: {
          primary: '#e11d48',   // Rose-600 (More sophisticated crimson)
          secondary: '#f59e0b', // Amber-500 (Knobs/Meters)
          success: '#10b981',   // Emerald-500
          warning: '#f59e0b',   // Amber-500
          danger: '#ef4444',    // Red-500
        },
        text: {
          primary: '#f4f4f5',   // Zinc-100
          secondary: '#a1a1aa', // Zinc-400
          muted: '#71717a',     // Zinc-500
        },
        border: {
          subtle: '#27272a',    // Zinc-800
          focus: '#e11d48',     // Rose-600
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow': '0 0 20px -5px rgba(225, 29, 72, 0.3)',
        'panel': '0 0 0 1px rgba(255,255,255,0.05), 0 4px 6px -1px rgba(0, 0, 0, 0.5)',
        'knob': '0 4px 6px -1px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'metallic': 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)',
      }
    },
  },
  plugins: [],
}
