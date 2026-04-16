import { THEME_PALETTE } from "./theme/palette.js";

// Tailwind color aliases intentionally point back to the shared palette.
// Many existing components still use families like emerald/cyan/amber/slate.
// Re-mapping them here lets the full app follow the same theme without page-level edits.
const brandPalette = {
  forest: THEME_PALETTE.brand.primary,
  forestHover: THEME_PALETTE.brand.primaryHover,
  cloud: THEME_PALETTE.neutral.canvas,
  surface: THEME_PALETTE.neutral.surface,
  surfaceMuted: THEME_PALETTE.neutral.surfaceMuted,
  grayText: THEME_PALETTE.neutral.text,
  grayDeep: THEME_PALETTE.neutral.textStrong,
  blue: THEME_PALETTE.accent.info,
  blueHover: THEME_PALETTE.accent.infoHover,
  teal: THEME_PALETTE.accent.secondaryAction,
  warm: THEME_PALETTE.accent.warning,
  danger: THEME_PALETTE.accent.danger,
  mint: THEME_PALETTE.brand.soft,
  moss: THEME_PALETTE.brand.muted,
};

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        emerald: {
          50: brandPalette.cloud,
          100: brandPalette.surfaceMuted,
          200: "#eadbff",
          300: brandPalette.mint,
          400: brandPalette.moss,
          500: brandPalette.forest,
          600: brandPalette.forestHover,
          700: "#5b21b6",
          800: "#4c1d95",
          900: "#3b0764",
        },
        amber: {
          50: brandPalette.cloud,
          100: "#fff1fb",
          200: "#ffd8ef",
          300: "#ffb4e0",
          400: brandPalette.warm,
          500: brandPalette.warm,
          600: "#db2777",
          700: "#be185d",
          800: "#9d174d",
          900: "#831843",
        },
        teal: {
          50: brandPalette.cloud,
          100: brandPalette.surfaceMuted,
          200: "#f1ddff",
          300: brandPalette.mint,
          400: brandPalette.moss,
          500: "#d946ef",
          600: "#c026d3",
          700: "#a21caf",
          800: "#86198f",
          900: "#701a75",
        },
        cyan: {
          50: brandPalette.cloud,
          100: "#fff0f8",
          200: "#ffd3e9",
          300: "#ffb0d8",
          400: "#f58bc4",
          500: brandPalette.blue,
          600: brandPalette.blueHover,
          700: "#be185d",
          800: "#9d174d",
          900: "#831843",
        },
        lime: {
          50: brandPalette.cloud,
          100: brandPalette.surfaceMuted,
          200: "#f2dfff",
          300: brandPalette.mint,
          400: brandPalette.moss,
          500: "#e879f9",
          600: "#d946ef",
          700: "#c026d3",
          800: "#a21caf",
          900: "#86198f",
        },
        slate: {
          50: brandPalette.cloud,
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: brandPalette.grayText,
          600: brandPalette.grayDeep,
          700: "#111827",
          800: "#0f172a",
          900: "#020617",
        },
        stone: {
          50: brandPalette.cloud,
          100: brandPalette.surface,
          200: "#e7e5e4",
          300: "#d6d3d1",
          400: "#a8a29e",
          500: "#78716c",
          600: "#57534e",
          700: "#44403c",
          800: "#292524",
          900: "#1c1917",
        },
        zinc: {
          50: brandPalette.cloud,
          100: brandPalette.surfaceMuted,
          200: "#e4e4e7",
          300: "#d4d4d8",
          400: "#a1a1aa",
          500: "#71717a",
          600: "#52525b",
          700: "#3f3f46",
          800: "#27272a",
          900: "#18181b",
          950: "#09090b",
        },
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
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "fade-in": {
          from: { opacity: 0 },
          to: { opacity: 1 },
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
      },
    },
  },
  plugins: [],
}
