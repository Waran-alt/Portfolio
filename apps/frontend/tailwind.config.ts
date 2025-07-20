import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      zIndex: {
        // Custom z-index values for overlay components
        'overlay': '99999',
        'modal': '999999',
        'tooltip': '9999999',
      },
      animation: {
        // Custom animations
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
      },
    },
  },
  plugins: [],
};

export default config; 