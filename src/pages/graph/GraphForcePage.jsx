import React, { useEffect, useState, useRef, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Loader2 } from 'lucide-react';
import { graphService } from '../../services/graphService';

export default function GraphForcePage({ folderId }) {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nodeSearch, setNodeSearch] = useState('');
  const [minDegree, setMinDegree] = useState(0);
  const [showOrphans, setShowOrphans] = useState(true);
  const [nodeTypeFilters, setNodeTypeFilters] = useState(new Set());
  const [relationshipTypeFilters, setRelationshipTypeFilters] = useState(new Set());
  const graphRef = useRef(null);

  const loadGraph = async () => {
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
        graphRef.current?.zoomToFit(250);
      }, 150);
    } catch (err) {
      console.error(err);
      setError('Failed to load graph data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (folderId) {
      loadGraph();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const resetFilters = () => {
    setNodeTypeFilters(new Set());
    setRelationshipTypeFilters(new Set());
    setMinDegree(0);
    setShowOrphans(true);
    setNodeSearch('');
  };

  const toggleType = (type, setTypeFn, currentSet) => {
    const next = new Set(currentSet);
    if (next.has(type)) next.delete(type);
    else next.add(type);
    setTypeFn(next);
  };

  return (
    <div className="rounded-lg border border-border overflow-hidden h-[calc(100vh-5rem)] bg-card">
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-background">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold">Force Graph</h2>
          <span className="text-xs text-muted-foreground">{graphData.nodes.length.toLocaleString()} nodes · {graphData.links.length.toLocaleString()} edges</span>
        </div>
        <div className="text-xs text-muted-foreground">2D force-directed graph (react-force-graph-2d)</div>
      </div>


      <div className="flex h-[calc(100%-6rem)] min-h-[calc(100vh-11rem)]">
        <aside className="w-72 min-w-[300px] border-r border-border bg-background p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Graph Filters</h3>
            <button
              onClick={resetFilters}
              className="text-xs text-primary hover:text-primary/80"
            >
              Reset
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-xs text-muted-foreground mb-1">Node name filter</label>
            <input
              value={nodeSearch}
              onChange={(e) => setNodeSearch(e.target.value)}
              placeholder="search node name"
              className="w-full rounded border border-border px-2 py-1 text-sm"
            />
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-muted-foreground">Min degree</label>
              <span className="text-xs font-semibold">{minDegree}</span>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              value={minDegree}
              onChange={(e) => setMinDegree(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="mb-4">
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={showOrphans}
                onChange={() => setShowOrphans((value) => !value)}
                className="accent-primary"
              />
              Show orphans
            </label>
          </div>

          <div className="mb-4">
            <h4 className="text-xs font-semibold mb-2">Node types</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {nodeTypes.map((type) => (
                <label key={type} className="flex items-center justify-between text-xs">
                  <span>{type}</span>
                  <input
                    type="checkbox"
                    checked={nodeTypeFilters.size ? nodeTypeFilters.has(type) : true}
                    onChange={() => toggleType(type, setNodeTypeFilters, nodeTypeFilters)}
                  />
                </label>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold mb-2">Relationship types</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {relationshipTypes.map((type) => (
                <label key={type} className="flex items-center justify-between text-xs">
                  <span>{type}</span>
                  <input
                    type="checkbox"
                    checked={relationshipTypeFilters.size ? relationshipTypeFilters.has(type) : true}
                    onChange={() => toggleType(type, setRelationshipTypeFilters, relationshipTypeFilters)}
                  />
                </label>
              ))}
            </div>
          </div>
        </aside>

        <main className="flex-1 relative overflow-hidden">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2">Loading graph data...</span>
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center text-red-500">{error}</div>
          ) : (
            <div className="absolute inset-0">
              <ForceGraph2D
                ref={graphRef}
                graphData={filteredGraph}
                nodeAutoColorBy="group"
                nodeLabel={(node) => `${node.id} ${node.type ? `(${node.type})` : ''}`}
                linkDirectionalParticles={2}
                linkDirectionalParticleSpeed={0.008}
                linkWidth={1}
                linkOpacity={0.6}
                nodeVal={(node) => (node.size || 1)}
                onNodeClick={(node) => window.alert(`Node clicked: ${node.id}`)}
                width={undefined}
                height={undefined}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
