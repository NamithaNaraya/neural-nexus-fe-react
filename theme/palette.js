// Global brand palette source for the React v2 app.
// For normal product-wide color changes, start here.
// Shared UI theme control is intentionally centered around:
// 1. theme/palette.js
// 2. tailwind.config.js
// 3. src/index.css
// Exceptions: custom graph 2D/3D/list/visualization rendering can keep their own palettes.
export const THEME_PALETTE = {
  brand: {
    primary: '#7fa88b',
    primaryHover: '#6c9478',
    soft: '#dcebdd',
    muted: '#d9cdea',
  },
  neutral: {
    canvas: '#f8fbf8',
    surface: '#ffffff',
    surfaceMuted: '#f2f7f2',
    text: '#5a6870',
    textStrong: '#23332d',
    border: '#d2ddd5',
  },
  accent: {
    info: '#b89bcf',
    infoHover: '#a687c0',
    secondaryAction: '#c7b2dc',
    warning: '#d7bddf',
    danger: '#c98395',
  },
};
