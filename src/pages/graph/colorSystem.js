const NODE_COLOR_PALETTE = [
  '#7C6CF2',
  '#3B82F6',
  '#14B8A6',
  '#F59E0B',
  '#EF5DA8',
  '#10B981',
  '#8B5CF6',
  '#F97316',
  '#06B6D4',
  '#84CC16',
  '#EC4899',
  '#6366F1',
];

const RELATIONSHIP_COLOR_PALETTE = [
  '#2563EB',
  '#0F766E',
  '#D97706',
  '#7C3AED',
  '#DB2777',
  '#0891B2',
  '#DC2626',
  '#65A30D',
  '#9333EA',
  '#0F766E',
  '#C2410C',
  '#1D4ED8',
];

function hashString(value = '') {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getPaletteColor(value, palette, fallback) {
  if (!value) return fallback;
  return palette[hashString(value) % palette.length] || fallback;
}

export function getNodeTypeColor(type, overrides = {}) {
  return overrides[type] || getPaletteColor(type, NODE_COLOR_PALETTE, '#64748B');
}

export function getRelationshipTypeColor(type, overrides = {}) {
  return overrides[type] || getPaletteColor(type, RELATIONSHIP_COLOR_PALETTE, '#475569');
}

export function withAlpha(hexColor, alphaHex = '18') {
  if (!hexColor || typeof hexColor !== 'string') return hexColor;
  if (hexColor.startsWith('#') && hexColor.length === 7) {
    return `${hexColor}${alphaHex}`;
  }
  return hexColor;
}
