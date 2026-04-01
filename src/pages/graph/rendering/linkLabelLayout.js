function normalizeEndpointId(endpoint) {
  if (endpoint && typeof endpoint === 'object') {
    return String(endpoint.id ?? '');
  }
  return String(endpoint ?? '');
}

function makeUnorderedPairKey(sourceId, targetId) {
  return [sourceId, targetId].sort().join('::');
}

function makeDirectedPairKey(sourceId, targetId) {
  return `${sourceId}=>${targetId}`;
}

function computeSpreadOffset(index, count, baseOffset = 14, step = 10) {
  const centered = index - (count - 1) / 2;
  return baseOffset + centered * step;
}

export function annotateParallelLinks(links = []) {
  const groups = new Map();

  links.forEach((link) => {
    const sourceId = normalizeEndpointId(link.source);
    const targetId = normalizeEndpointId(link.target);
    const pairKey = makeUnorderedPairKey(sourceId, targetId);

    if (!groups.has(pairKey)) {
      groups.set(pairKey, []);
    }

    groups.get(pairKey).push({ link, sourceId, targetId });
  });

  const annotatedLinks = [];

  groups.forEach((groupEntries) => {
    const orderedEntries = [...groupEntries].sort((left, right) => {
      const leftKey = `${left.link.type || ''}:${left.link.id || ''}`;
      const rightKey = `${right.link.type || ''}:${right.link.id || ''}`;
      return leftKey.localeCompare(rightKey);
    });

    const directionBuckets = new Map();
    orderedEntries.forEach((entry) => {
      const directionKey = makeDirectedPairKey(entry.sourceId, entry.targetId);
      if (!directionBuckets.has(directionKey)) {
        directionBuckets.set(directionKey, []);
      }
      directionBuckets.get(directionKey).push(entry);
    });

    const canonicalSourceId = [...orderedEntries]
      .map((entry) => entry.sourceId)
      .sort()[0];

    directionBuckets.forEach((entries) => {
      entries.forEach((entry, index) => {
        const directionSign = entry.sourceId === canonicalSourceId ? 1 : -1;
        const offset = computeSpreadOffset(index, entries.length);

        annotatedLinks.push({
          ...entry.link,
          labelSide: directionSign,
          labelOffset: directionSign * offset,
          parallelIndex: index,
          parallelCount: entries.length,
        });
      });
    });
  });

  return annotatedLinks;
}

export function getLinkLabelPlacement(link, sourcePoint, targetPoint, offsetScale = 1) {
  const dx = targetPoint.x - sourcePoint.x;
  const dy = targetPoint.y - sourcePoint.y;
  const length = Math.hypot(dx, dy);

  if (!length) {
    return null;
  }

  const midpointX = sourcePoint.x + dx * 0.5;
  const midpointY = sourcePoint.y + dy * 0.5;
  const normalX = -dy / length;
  const normalY = dx / length;
  const offset = (link.labelOffset || 0) * offsetScale;

  let angle = Math.atan2(dy, dx);
  if (angle > Math.PI / 2 || angle < -Math.PI / 2) {
    angle += Math.PI;
  }

  return {
    x: midpointX + normalX * offset,
    y: midpointY + normalY * offset,
    angle,
    length,
  };
}

