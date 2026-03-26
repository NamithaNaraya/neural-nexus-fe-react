import React, { useEffect, useState, useRef, useMemo } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import { Loader2 } from 'lucide-react';
import { graphService } from '../../services/graphService';

export default function GraphForceGraph3DPage({ folderId, nodeTypeFilters, relationshipTypeFilters, minDegree, showOrphans, nodeSearch }) {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const graphRef = useRef(null);

  useEffect(() => {
    const load = async () => {
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
          graphRef.current?.zoomToFit(300);
        }, 150);
      } catch (err) {
        console.error(err);
        setError('Failed to load graph data.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [folderId]);

  const nodeTypes = useMemo(() => {
    const types = new Set();
    graphData.nodes.forEach((node) => {
      if (node.type) types.add(node.type);
      else types.add('Unknown');
    });
    return [...types].sort();
  }, [graphData.nodes]);

  const relationshipTypes = useMemo(() => {
    const types = new Set();
    graphData.links.forEach((link) => {
      if (link.type) types.add(link.type);
      else types.add('Unknown');
    });
    return [...types].sort();
  }, [graphData.links]);

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

    const nodeIds = new Set(nodes.map((n) => n.id));

    const selectedRelTypes = relationshipTypeFilters.size ? relationshipTypeFilters : new Set(relationshipTypes);

    const links = graphData.links.filter((link) => {
      const type = link.type || 'Unknown';
      if (!selectedRelTypes.has(type)) return false;
      if (!nodeIds.has(link.source) || !nodeIds.has(link.target)) return false;
      return true;
    });

    return { nodes, links };
  }, [graphData, nodeTypes, relationshipTypes, nodeTypeFilters, relationshipTypeFilters, minDegree, showOrphans, nodeSearch]);

  return (
    <div className="w-full h-full flex flex-col bg-card">
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-background">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">3D Force Graph</h2>
          <span className="text-xs text-muted-foreground">{filteredGraph.nodes.length.toLocaleString()} nodes · {filteredGraph.links.length.toLocaleString()} edges</span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Loading 3D graph...</span>
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center text-red-500">{error}</div>
        ) : (
          <div className="absolute inset-0">
            <ForceGraph3D
              ref={graphRef}
              graphData={filteredGraph}
              nodeAutoColorBy="group"
              nodeLabel={(node) => `${node.id} ${node.type ? `(${node.type})` : ''}`}
              nodeVal={(node) => (node.size || 1)}
              linkWidth={0.5}
              linkOpacity={0.6}
              onNodeClick={(node) => window.alert(`Node: ${node.id}`)}
              width={undefined}
              height={undefined}
            />
          </div>
        )}
      </div>
    </div>
  );
}
