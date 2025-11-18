/* eslint-disable @typescript-eslint/no-require-imports */
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'rgb(var(--color-border))',
        input: 'rgb(var(--color-input))',
        ring: 'rgb(var(--color-ring))',
        background: 'rgb(var(--color-background))',
        foreground: 'rgb(var(--color-foreground))',
        primary: {
          DEFAULT: 'rgb(var(--color-primary))',
          dark: 'rgb(var(--color-primary-dark))',
          light: 'rgb(var(--color-primary-light))',
          foreground: 'rgb(var(--color-primary-foreground))',
        },
        secondary: {
          DEFAULT: 'rgb(var(--color-secondary))',
          foreground: 'rgb(var(--color-secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'rgb(var(--color-destructive))',
          foreground: 'rgb(var(--color-destructive-foreground))',
        },
        muted: {
          DEFAULT: 'rgb(var(--color-muted))',
          foreground: 'rgb(var(--color-muted-foreground))',
        },
        accent: {
          DEFAULT: 'rgb(var(--color-accent))',
          foreground: 'rgb(var(--color-accent-foreground))',
        },
        popover: {
          DEFAULT: 'rgb(var(--color-popover))',
          foreground: 'rgb(var(--color-popover-foreground))',
        },
        card: {
          DEFAULT: 'rgb(var(--color-card))',
          foreground: 'rgb(var(--color-card-foreground))',
        },
        sidebar: {
          DEFAULT: 'rgb(var(--color-sidebar))',
          foreground: 'rgb(var(--color-sidebar-foreground))',
        },
        nav: {
          DEFAULT: 'rgb(var(--color-nav))',
          foreground: 'rgb(var(--color-nav-foreground))',
        },
        content: {
          DEFAULT: 'rgb(var(--color-content))',
          foreground: 'rgb(var(--color-content-foreground))',
        },
        success: 'rgb(var(--color-success))',
        warning: 'rgb(var(--color-warning))',
        error: 'rgb(var(--color-error))',
        info: 'rgb(var(--color-info))',
        blue: {
          50: 'rgb(var(--color-blue-50))',
          100: 'rgb(var(--color-blue-100))',
          300: 'rgb(var(--color-blue-300))',
          500: 'rgb(var(--color-blue-500))',
          600: 'rgb(var(--color-blue-600))',
          800: 'rgb(var(--color-blue-800))',
        },
        cyan: {
          300: 'rgb(var(--color-cyan-300))',
          400: 'rgb(var(--color-cyan-400))',
          500: 'rgb(var(--color-cyan-500))',
        },
        orange: {
          50: '#FFF5EC',
          100: '#FFE5D0',
          200: '#FFC299',
          300: '#FFA066',
          400: '#FF8B30',
          500: '#F7A332',
          600: '#DB660F',
          700: '#B14F0A',
          800: '#803906',
          900: '#4D2202',
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, rgb(var(--color-primary)) 0%, rgb(var(--color-primary-light)) 100%)',
        'gradient-logo': 'linear-gradient(135deg, rgb(var(--color-primary)) 0%, rgb(var(--color-cyan-300)) 100%)',
        'gradient-accent': 'linear-gradient(135deg, rgb(var(--color-accent)) 0%, #FFB84D 100%)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      boxShadow: {
        'theme-sm': 'var(--shadow-sm)',
        'theme': 'var(--shadow)',
        'theme-md': 'var(--shadow-md)',
        'theme-lg': 'var(--shadow-lg)',
        'theme-xl': 'var(--shadow-xl)',
        'glow-primary': 'var(--glow-primary)',
        'glow-accent': 'var(--glow-accent)',
        'glow-sm': '0 0 10px rgba(50, 111, 247, 0.3)',
        'glow-md': '0 0 20px rgba(50, 111, 247, 0.4), 0 0 40px rgba(77, 132, 249, 0.2)',
        'glow-lg': '0 0 30px rgba(50, 111, 247, 0.5), 0 0 60px rgba(103, 232, 249, 0.3)',
      },
      fontFamily: {
        poppins: ['var(--font-poppins)', 'sans-serif'],
        montserrat: ['var(--font-montserrat)', 'sans-serif'],
        'sans-hebrew': ['var(--font-sans-hebrew)', 'sans-serif'],
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'gradient': 'gradient 3s ease infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(50, 111, 247, 0.3), 0 0 40px rgba(77, 132, 249, 0.2)' },
          '100%': { boxShadow: '0 0 30px rgba(50, 111, 247, 0.5), 0 0 60px rgba(103, 232, 249, 0.3)' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};