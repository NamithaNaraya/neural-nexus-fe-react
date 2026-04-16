// Global brand palette source for the React v2 app.
// For normal product-wide color changes, start here.
// Shared UI theme control is intentionally centered around:
// 1. theme/palette.js
// 2. tailwind.config.js
// 3. src/index.css
// Exceptions: custom graph 2D/3D/list/visualization rendering can keep their own palettes.
export const THEME_PALETTE = {
  brand: {
    primary: '#7c3aed',
    primaryHover: '#6d28d9',
    soft: '#e9d5ff',
    muted: '#f5b8ff',
  },
  neutral: {
    canvas: '#fcfaff',
    surface: '#ffffff',
    surfaceMuted: '#f6f0ff',
    text: '#475569',
    textStrong: '#1f2937',
    border: '#d8c7f4',
  },
  accent: {
    info: '#ec4899',
    infoHover: '#db2777',
    secondaryAction: '#a855f7',
    warning: '#f472b6',
    danger: '#e11d48',
  },
};
