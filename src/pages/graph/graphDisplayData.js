export function capGraphData(graphData, maxNodes = 5000) {
  const nodes = Array.isArray(graphData?.nodes) ? graphData.nodes : [];
  const links = Array.isArray(graphData?.links) ? graphData.links : [];

  const rankedNodes = [...nodes].sort((a, b) => (Number(b.degree || 0) - Number(a.degree || 0)));
  const keptNodes = rankedNodes.slice(0, maxNodes);
  const nodeIds = new Set(keptNodes.map((node) => node.id));

  const keptLinks = links.filter((link) => {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    return nodeIds.has(sourceId) && nodeIds.has(targetId);
  });

  return { nodes: keptNodes, links: keptLinks };
}
