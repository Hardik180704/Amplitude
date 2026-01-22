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
            main: '#121214',      // Deep Graphite (Background)
            panel: '#18181b',     // Zinc-900 (Panels)
            header: '#18181b',    // Match panel for seamless headers
            hover: '#27272a',     // Zinc-800
            glass: 'rgba(24, 24, 27, 0.7)', // Glassy Zinc
            active: '#27272a',    
          },
          text: {
            primary: '#f4f4f5',   // Zinc-100 (High Contrast)
            secondary: '#a1a1aa', // Zinc-400
            muted: '#52525b',     // Zinc-600
          },
          accent: {
            primary: '#3b82f6',   // Electric Blue
            secondary: '#8b5cf6', // Vivid Violet
            success: '#10b981',   // Emerald
            warning: '#f59e0b',   // Amber
            danger: '#ef4444',    // Red-500
          },
          border: {
             DEFAULT: '#27272a',  // Zinc-800
             subtle: '#1f1f22',   // Zinc-900/800 mix
             active: '#3b82f6',   // Blue Border
          }
        },
        boxShadow: {
            'glow-sm': '0 0 10px rgba(59, 130, 246, 0.15)',
            'glow-md': '0 0 20px rgba(59, 130, 246, 0.25)',
            'panel': '0 4px 20px -5px rgba(0, 0, 0, 0.5)',
            'knob': '0 2px 5px rgba(0,0,0,0.5)',
            'inner-depth': 'inset 0 2px 4px rgba(0,0,0,0.5)',
        },
        fontFamily: {
             mono: ['JetBrains Mono', 'Menlo', 'monospace'],
             sans: ['Inter', 'system-ui', 'sans-serif'],
        },
        backgroundImage: {
            'metallic': 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.0) 100%)',
            'stripes': 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.1) 10px, rgba(0,0,0,0.1) 20px)',
        }
      },
    },
    plugins: [],
}
