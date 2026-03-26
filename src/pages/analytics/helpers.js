export function getDisplayName(item) {
  if (!item || typeof item !== 'object') return 'Unnamed';

  const candidates = [
    item.name,
    item.source_name,
    item.target_name,
    item.title,
    item.label,
    item.text,
    item.content,
    item.value,
    item.id,
  ];

  return candidates.find((value) => typeof value === 'string' && value.trim()) || 'Unnamed';
}

export function getDisplayType(item) {
  return item?.type || item?.source_type || 'Entity';
}

export function getScoreLabel(item) {
  if (typeof item?.score === 'number') return item.score.toFixed(4);
  if (typeof item?.similarity === 'number') return item.similarity.toFixed(4);
  if (typeof item?.auth_score === 'number' || typeof item?.hub_score === 'number') {
    return `A ${Number(item.auth_score || 0).toFixed(3)} / H ${Number(item.hub_score || 0).toFixed(3)}`;
  }
  if (item?.community !== undefined || item?.community_id !== undefined) {
    return `Group ${item.community ?? item.community_id}`;
  }
  return '-';
}

export function formatAlgorithmSummary(result, selectedAlgorithm, selectedNodesCount, folderName) {
  if (!result) return '';

  const scope = selectedNodesCount > 0
    ? `${selectedNodesCount} selected node${selectedNodesCount === 1 ? '' : 's'}`
    : folderName || 'the current graph scope';

  const insight = result.insight || `Algorithm completed for ${scope}.`;
  return `${selectedAlgorithm?.name || 'Algorithm'} ran on ${scope}. ${insight}`;
}

export function describeWeightFormula(formula) {
  if (!formula) return 'No quantitative weighting applied.';

  if (formula.type === 'property') {
    return `Weighted by relationship property "${formula.property}".`;
  }

  if (formula.type === 'ratio') {
    return `Weighted by ratio "${formula.numerator} / ${formula.denominator}".`;
  }

  if (formula.type === 'weighted_sum') {
    return `Weighted by ${formula.terms.map((term) => `${term.coefficient}x ${term.property}`).join(' + ')}.`;
  }

  return 'Custom quantitative weighting applied.';
}
