import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { FolderOpen, GitBranch, Network, Search } from 'lucide-react';
import GraphOverviewPage from './graph/GraphOverviewPage';
import GraphForcePage from './graph/GraphForcePage';
import GraphForceGraph3DPage from './graph/GraphForceGraph3DPage';
import GraphSunburstPage from './graph/GraphSunburstPage';
import GraphTreemapPage from './graph/GraphTreemapPage';
import GraphSchemaExplorerPage from './graph/GraphSchemaExplorerPage';
import GraphDegreeDistributionPage from './graph/GraphDegreeDistributionPage';
import GraphRelationshipMatrixPage from './graph/GraphRelationshipMatrixPage';
import GraphPropertyTablePage from './graph/GraphPropertyTablePage';
import { GraphViewsNavigation } from './graph/GraphViewsNavigation';
import { folderService } from '../services/folderService';
import { graphService } from '../services/graphService';
import { Input, Label } from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';
import { cn } from '../utils/cn';

function FilterChip({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1.5 text-xs font-medium transition',
        active
          ? 'border-primary bg-primary text-white'
          : 'border-border/50 bg-background/60 text-muted-foreground hover:border-primary/30 hover:text-foreground'
      )}
    >
      {label}
    </button>
  );
}

export default function GraphPage() {
  const [folders, setFolders] = useState([]);
  const [folderId, setFolderId] = useState('');
  const [nodeSearch, setNodeSearch] = useState('');
  const [minDegree, setMinDegree] = useState(0);
  const [showOrphans, setShowOrphans] = useState(true);
  const [nodeTypeFilters, setNodeTypeFilters] = useState(new Set());
  const [relationshipTypeFilters, setRelationshipTypeFilters] = useState(new Set());
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });

  useEffect(() => {
    let ignore = false;

    async function loadFolders() {
      try {
        const folderList = await folderService.list();
        if (ignore) return;
        setFolders(folderList || []);
        const firstId = folderList?.[0]?.id;
        if (firstId) setFolderId(String(firstId));
      } catch (error) {
        console.error('Failed to load folders:', error);
      }
    }

    loadFolders();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadGraphContext() {
      if (!folderId) {
        setGraphData({ nodes: [], links: [] });
        return;
      }

      try {
        const data = await graphService.getFolder(folderId, 10000);
        if (!ignore) setGraphData(data || { nodes: [], links: [] });
      } catch (error) {
        console.error('Failed to load graph context:', error);
        if (!ignore) setGraphData({ nodes: [], links: [] });
      }
    }

    loadGraphContext();
    return () => {
      ignore = true;
    };
  }, [folderId]);

  const nodeTypes = useMemo(
    () => [...new Set((graphData.nodes || []).map((node) => node.type || 'Unknown'))].sort(),
    [graphData.nodes]
  );

  const relationshipTypes = useMemo(
    () => [...new Set((graphData.links || []).map((link) => link.type || 'Unknown'))].sort(),
    [graphData.links]
  );

  const toggleFilterValue = (value, setState) => {
    setState((current) => {
      const next = new Set(current);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const sharedGraphProps = {
    folderId,
    nodeTypeFilters,
    relationshipTypeFilters,
    minDegree,
    showOrphans,
    nodeSearch,
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">
          <span className="gradient-text">Graph Views</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Switch between every available graph view from one place.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
        <Card className="h-fit border-border/60 bg-card/70 shadow-lg shadow-slate-900/5 backdrop-blur-xl xl:sticky xl:top-4">
          <CardContent className="space-y-5 p-5">
            <div className="space-y-1">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Filters</div>
              <h2 className="text-lg font-semibold">Graph sidebar</h2>
              <p className="text-sm text-muted-foreground">These filters stay active while switching between all graph views.</p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Folder</Label>
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-primary" />
                <select
                  value={folderId}
                  onChange={(event) => setFolderId(event.target.value)}
                  className="h-10 w-full rounded-xl border border-border/60 bg-background/70 px-3 text-sm outline-none"
                >
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name || folder.id}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Search nodes</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={nodeSearch}
                  onChange={(event) => setNodeSearch(event.target.value)}
                  placeholder="Find nodes by name"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Min degree</Label>
              <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-background/40 px-3 py-2">
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={minDegree}
                  onChange={(event) => setMinDegree(Number(event.target.value))}
                  className="w-full"
                />
                <span className="text-sm font-semibold text-primary">{minDegree}</span>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={showOrphans}
                onChange={() => setShowOrphans((value) => !value)}
                className="accent-primary"
              />
              Show orphan nodes
            </label>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <Network className="h-3.5 w-3.5" />
                Node types
              </div>
              <div className="flex flex-wrap gap-2">
                {nodeTypes.map((type) => (
                  <FilterChip
                    key={type}
                    active={nodeTypeFilters.has(type)}
                    label={type}
                    onClick={() => toggleFilterValue(type, setNodeTypeFilters)}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <GitBranch className="h-3.5 w-3.5" />
                Relationship types
              </div>
              <div className="flex flex-wrap gap-2">
                {relationshipTypes.map((type) => (
                  <FilterChip
                    key={type}
                    active={relationshipTypeFilters.has(type)}
                    label={type}
                    onClick={() => toggleFilterValue(type, setRelationshipTypeFilters)}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-border/60 bg-card/70 shadow-lg shadow-slate-900/5 backdrop-blur-xl">
            <CardContent className="p-4">
              <GraphViewsNavigation />
            </CardContent>
          </Card>

          <div className="h-[calc(100vh-14rem)] min-h-[680px] overflow-hidden rounded-2xl border border-border/60 bg-card/50">
            <Routes>
              <Route path="" element={<Navigate to="overview" replace />} />
              <Route path="overview" element={<GraphOverviewPage folderId={folderId} />} />
              <Route path="2d" element={<GraphForcePage {...sharedGraphProps} />} />
              <Route path="3d" element={<GraphForceGraph3DPage {...sharedGraphProps} />} />
              <Route path="sunburst" element={<GraphSunburstPage folderId={folderId} />} />
              <Route path="treemap" element={<GraphTreemapPage folderId={folderId} />} />
              <Route path="schema" element={<GraphSchemaExplorerPage folderId={folderId} />} />
              <Route path="degree" element={<GraphDegreeDistributionPage folderId={folderId} />} />
              <Route path="matrix" element={<GraphRelationshipMatrixPage folderId={folderId} />} />
              <Route path="table" element={<GraphPropertyTablePage folderId={folderId} />} />
              <Route path="*" element={<Navigate to="overview" replace />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
}
