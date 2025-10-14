/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Golf-themed colors
        golf: {
          fairway: '#1a7f37',
          green: '#0d4d22',
          sand: '#d4a574',
          sky: '#87ceeb',
          sunset: '#ff6b35',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      animation: {
        'video-fade-dissolve': 'videoFadeDissolve 8s ease-in-out infinite',
        'parallax-slow': 'parallaxSlow 40s ease-in-out infinite alternate',
        'parallax-medium': 'parallaxMedium 30s ease-in-out infinite alternate',
        'parallax-fast': 'parallaxFast 20s ease-in-out infinite alternate',
        'gradient-shift': 'gradientShift 6s ease infinite',
        'ripple': 'ripple 0.6s ease-out',
        'card-float': 'cardFloat 3s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s ease-in-out infinite',
        'flag-wave': 'flagWave 2s ease-in-out infinite',
      },
      keyframes: {
        videoFadeDissolve: {
          '0%': {
            opacity: '0',
          },
          '15%': {
            opacity: '0.4',
          },
          '50%': {
            opacity: '0.6',
          },
          '85%': {
            opacity: '0.3',
          },
          '100%': {
            opacity: '0',
          },
        },
        parallaxSlow: {
          '0%': { transform: 'translateY(0) scale(1.1)' },
          '100%': { transform: 'translateY(-20px) scale(1.15)' },
        },
        parallaxMedium: {
          '0%': { transform: 'translateY(0) scale(1.05)' },
          '100%': { transform: 'translateY(-15px) scale(1.08)' },
        },
        parallaxFast: {
          '0%': { transform: 'translateY(0) scale(1.02)' },
          '100%': { transform: 'translateY(-10px) scale(1.05)' },
        },
        gradientShift: {
          '0%, 100%': {
            backgroundPosition: '0% 50%'
          },
          '50%': {
            backgroundPosition: '100% 50%'
          },
        },
        ripple: {
          '0%': {
            transform: 'scale(0)',
            opacity: '1',
          },
          '100%': {
            transform: 'scale(4)',
            opacity: '0',
          },
        },
        cardFloat: {
          '0%, 100%': {
            transform: 'translateY(0px) rotateX(0deg)',
          },
          '50%': {
            transform: 'translateY(-10px) rotateX(2deg)',
          },
        },
        shimmer: {
          '0%': {
            backgroundPosition: '-200% center',
          },
          '100%': {
            backgroundPosition: '200% center',
          },
        },
        flagWave: {
          '0%, 100%': {
            transform: 'rotate(0deg)',
          },
          '25%': {
            transform: 'rotate(-5deg)',
          },
          '75%': {
            transform: 'rotate(5deg)',
          },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}