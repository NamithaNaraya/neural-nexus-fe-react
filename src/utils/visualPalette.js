/**
 * NESSO branded palette aligned to the core 5-color system.
 */

export const BRAND_COLORS = {
  forest: '#197741',
  cloud: '#fafbfb',
  citron: '#e9d319',
  mint: '#95c9ac',
  moss: '#7cac94',
  emerald: '#197741',
  sage: '#95c9ac',
  amber: '#7cac94',
  slate: '#7cac94',
  cyan: '#95c9ac',
  violet: '#7cac94',
  rose: '#7cac94',
  lime: '#95c9ac',
};

export const VISUAL_PALETTE = [
  BRAND_COLORS.forest,
  BRAND_COLORS.citron,
  BRAND_COLORS.mint,
  BRAND_COLORS.moss,
  BRAND_COLORS.cloud,
];

export const getStatusColor = (status) => {
  switch (status) {
    case 'success':
    case 'healthy':
    case 'up':
      return BRAND_COLORS.forest;
    case 'warning':
    case 'degraded':
      return BRAND_COLORS.citron;
    case 'error':
    case 'danger':
    case 'unhealthy':
    case 'down':
      return BRAND_COLORS.moss;
    default:
      return BRAND_COLORS.mint;
  }
};
