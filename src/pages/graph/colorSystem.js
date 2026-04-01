const NODE_COLOR_PALETTE = [
  '#A78BFA',
  '#F472B6',
  '#FB923C',
  '#FCD34D',
  '#6EE7B7',
  '#7DD3FC',
  '#FCA5A5',
  '#86EFAC',
  '#C084FC',
  '#5EEAD4',
  '#818CF8',
  '#BEF264',
  '#FDA4AF',
  '#67E8F9',
  '#FDE047',
  '#93C5FD',
  '#D8B4FE',
  '#FDBA74',
  '#99F6E4',
  '#E9D5FF',
  '#FECDD3',
  '#BBF7D0',
  '#BFDBFE',
  '#FED7AA',
];

const RELATIONSHIP_COLOR_PALETTE = [
  '#355070',
  '#4A5568',
  '#5F6F52',
  '#6B7280',
  '#4B5563',
  '#516B8B',
  '#7C6A58',
  '#5B7065',
  '#475569',
  '#6C757D',
  '#556B7A',
  '#7A6F5A',
  '#526D82',
  '#667761',
  '#6B7280',
  '#4C5C68',
  '#5E6472',
  '#7D7461',
  '#5C677D',
  '#6E7F80',
];

const assignedNodeTypeColors = new Map();
const usedNodeColorIndices = new Set();
const assignedRelationshipColors = new Map();
const usedRelationshipColorIndices = new Set();

function hashString(value = '') {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    const char = value.charCodeAt(index);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

function assignUniqueColor(type, palette, assignedMap, usedIndices, fallback) {
  if (!type) return fallback;
  if (assignedMap.has(type)) return assignedMap.get(type);

  const hash = hashString(type);
  const startIndex = hash % palette.length;

  for (let attempt = 0; attempt < palette.length; attempt += 1) {
    const paletteIndex = (startIndex + attempt) % palette.length;
    if (!usedIndices.has(paletteIndex)) {
      usedIndices.add(paletteIndex);
      const color = palette[paletteIndex];
      assignedMap.set(type, color);
      return color;
    }
  }

  const hue = (assignedMap.size * 137.508) % 360;
  const generated = `hsl(${Math.round(hue)}, 70%, 75%)`;
  assignedMap.set(type, generated);
  return generated;
}

export function getNodeTypeColor(type, overrides = {}) {
  return overrides[type] || assignUniqueColor(type, NODE_COLOR_PALETTE, assignedNodeTypeColors, usedNodeColorIndices, '#6B7280');
}

export function getRelationshipTypeColor(type, overrides = {}) {
  return overrides[type] || assignUniqueColor(type, RELATIONSHIP_COLOR_PALETTE, assignedRelationshipColors, usedRelationshipColorIndices, '#64748B');
}

export function withAlpha(hexColor, alphaHex = '18') {
  if (!hexColor || typeof hexColor !== 'string') return hexColor;
  if (hexColor.startsWith('#') && hexColor.length === 7) {
    return `${hexColor}${alphaHex}`;
  }
  return hexColor;
}
