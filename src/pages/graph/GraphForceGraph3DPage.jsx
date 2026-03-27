import React, { useEffect, useMemo, useRef, useState } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import { Loader2 } from 'lucide-react';
import { graphService } from '../../services/graphService';
import { getNodeTypeColor, getRelationshipTypeColor, withAlpha } from './colorSystem';

export default function GraphForceGraph3DPage({
  folderId,
  nodeTypeFilters,
  relationshipTypeFilters,
  nodeTypeColors,
  relationshipTypeColors,
  minDegree,
  showOrphans,
  nodeSearch,
}) {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const graphRef = useRef(null);

  useEffect(() => {
    async function loadGraph() {
      if (!folderId) {
        setGraphData({ nodes: [], links: [] });
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await graphService.getFolder(folderId, 10000);
        setGraphData(data);

        setTimeout(() => {
          graphRef.current?.zoomToFit(320, 70);
        }, 220);
      } catch (err) {
        console.error(err);
        setError('Failed to load graph data.');
      } finally {
        setLoading(false);
      }
    }

    loadGraph();
  }, [folderId]);

  const nodeTypes = useMemo(
    () => [...new Set(graphData.nodes.map((node) => node.type || 'Unknown'))].sort(),
    [graphData.nodes]
  );

  const relationshipTypes = useMemo(
    () => [...new Set(graphData.links.map((link) => link.type || 'Unknown'))].sort(),
    [graphData.links]
  );

  const filteredGraph = useMemo(() => {
    const selectedNodeTypes = nodeTypeFilters.size ? nodeTypeFilters : new Set(nodeTypes);

    const nodes = graphData.nodes.filter((node) => {
      const type = node.type || 'Unknown';
      if (!selectedNodeTypes.has(type)) return false;
      if (!showOrphans && (node.degree ?? 0) === 0) return false;
      if ((node.degree ?? 0) < minDegree) return false;
      if (nodeSearch.trim() && !(node.name || '').toLowerCase().includes(nodeSearch.toLowerCase())) return false;
      return true;
    });

    const nodeIds = new Set(nodes.map((node) => node.id));
    const selectedRelTypes = relationshipTypeFilters.size ? relationshipTypeFilters : new Set(relationshipTypes);

    const links = graphData.links
      .filter((link) => {
        const type = link.type || 'Unknown';
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;

        if (!selectedRelTypes.has(type)) return false;
        if (!nodeIds.has(sourceId) || !nodeIds.has(targetId)) return false;
        return true;
      })
      .map((link) => ({
        ...link,
        color: getRelationshipTypeColor(link.type || 'Unknown', relationshipTypeColors),
      }));

    const enrichedNodes = nodes.map((node) => ({
      ...node,
      color: getNodeTypeColor(node.type || 'Unknown', nodeTypeColors),
    }));

    return { nodes: enrichedNodes, links };
  }, [
    graphData,
    nodeTypes,
    relationshipTypes,
    nodeTypeFilters,
    relationshipTypeFilters,
    nodeTypeColors,
    relationshipTypeColors,
    minDegree,
    showOrphans,
    nodeSearch,
  ]);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-[26px] bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.1),transparent_22%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.08),transparent_20%),linear-gradient(180deg,#f8fbff,#eef3f9)] dark:bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_22%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.1),transparent_20%),linear-gradient(180deg,#0f172a,#111827)]">
      <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold">3D Force Graph</h2>
          <p className="text-xs text-muted-foreground">
            {filteredGraph.nodes.length.toLocaleString()} nodes and {filteredGraph.links.length.toLocaleString()} edges
          </p>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading 3D graph...</span>
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center text-red-500">{error}</div>
        ) : (
          <div className="absolute inset-0">
            <ForceGraph3D
              ref={graphRef}
              graphData={filteredGraph}
              backgroundColor="rgba(0,0,0,0)"
              nodeColor={(node) => node.color}
              nodeOpacity={0.95}
              nodeVal={(node) => Math.max(2, Number(node.size || node.degree || 1) * 1.6)}
              nodeResolution={10}
              nodeLabel={(node) => `${node.name || node.id}${node.type ? ` (${node.type})` : ''}`}
              linkColor={(link) => withAlpha(link.color || '#94A3B8', '88')}
              linkOpacity={0.32}
              linkWidth={(link) => (link.type ? 1.2 : 0.8)}
              linkDirectionalParticles={1}
              linkDirectionalParticleColor={(link) => link.color}
              linkDirectionalParticleWidth={2}
              linkDirectionalParticleSpeed={0.0045}
              onNodeClick={(node) => window.alert(`Node: ${node.name || node.id}`)}
              width={undefined}
              height={undefined}
            />
          </div>
        )}
      </div>
    </div>
  );
}
