/**
 * NESSO Branded Palette for Data Visualizations.
 * These colors are synchronized with the laboratory emerald identity.
 */

export const BRAND_COLORS = {
  emerald: '#10B981', // emerald-500
  sage: '#14B8A6',    // teal-500
  amber: '#F59E0B',   // amber-500
  slate: '#64748B',   // slate-500
  cyan: '#06B6D4',    // cyan-500
  violet: '#8B5CF6',  // violet-500
  rose: '#F43F5E',    // rose-500
  lime: '#84CC16',    // lime-500
};

export const VISUAL_PALETTE = [
  BRAND_COLORS.emerald,
  BRAND_COLORS.amber,
  BRAND_COLORS.sage,
  BRAND_COLORS.violet,
  BRAND_COLORS.cyan,
  BRAND_COLORS.rose,
  BRAND_COLORS.lime,
  BRAND_COLORS.slate,
];

export const getStatusColor = (status) => {
  switch (status) {
    case 'success':
    case 'healthy':
    case 'up':
      return BRAND_COLORS.emerald;
    case 'warning':
    case 'degraded':
      return BRAND_COLORS.amber;
    case 'error':
    case 'danger':
    case 'unhealthy':
    case 'down':
      return BRAND_COLORS.rose;
    default:
      return BRAND_COLORS.slate;
  }
};
