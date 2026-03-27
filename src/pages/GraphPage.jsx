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
import { GraphColorFilterSection } from './graph/components/GraphColorFilterSection';
import { graphService } from '../services/graphService';
import { useGlobalFolder } from '../contexts/GlobalFolderContext';
import { Input, Label } from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';
import { getNodeTypeColor, getRelationshipTypeColor } from './graph/colorSystem';

export default function GraphPage() {
  const { selectedFolderId: folderId, currentFolder } = useGlobalFolder();
  const [nodeSearch, setNodeSearch] = useState('');
  const [minDegree, setMinDegree] = useState(0);
  const [showOrphans, setShowOrphans] = useState(true);
  const [nodeTypeFilters, setNodeTypeFilters] = useState(new Set());
  const [relationshipTypeFilters, setRelationshipTypeFilters] = useState(new Set());
  const [nodeTypeColors, setNodeTypeColors] = useState({});
  const [relationshipTypeColors, setRelationshipTypeColors] = useState({});
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });

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

  const sharedGraphProps = {
    folderId,
    nodeTypeFilters,
    relationshipTypeFilters,
    nodeTypeColors,
    relationshipTypeColors,
    minDegree,
    showOrphans,
    nodeSearch,
  };

  return (
    <div>
      <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
        <Card className="h-fit border-border/60 bg-card/70 shadow-lg shadow-slate-900/5 backdrop-blur-xl xl:sticky xl:top-4">
          <CardContent className="space-y-5 p-5">
            <div className="space-y-1">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Filters</div>
              <h2 className="text-lg font-semibold">Graph sidebar</h2>
              <p className="text-sm text-muted-foreground">These filters stay active while switching between all graph views, and they follow the global header folder.</p>
            </div>

            <div className="rounded-2xl border border-border/40 bg-background/40 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <FolderOpen className="h-4 w-4 text-primary" />
                {currentFolder?.name || 'No folder selected'}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {currentFolder
                  ? `${Number(currentFolder.node_count || 0).toLocaleString()} nodes and ${Number(currentFolder.file_count || 0).toLocaleString()} files available in this scope.`
                  : 'Choose a folder in the header to load graph views.'}
              </p>
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
              <GraphColorFilterSection
                title="Node types"
                icon={Network}
                items={nodeTypes}
                activeItems={nodeTypeFilters}
                setActiveItems={setNodeTypeFilters}
                colorMap={nodeTypeColors}
                getColor={getNodeTypeColor}
              />
            </div>

            <div className="space-y-2">
              <GraphColorFilterSection
                title="Relationship types"
                icon={GitBranch}
                items={relationshipTypes}
                activeItems={relationshipTypeFilters}
                setActiveItems={setRelationshipTypeFilters}
                colorMap={relationshipTypeColors}
                getColor={getRelationshipTypeColor}
              />
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
              <Route path="overview" element={<GraphOverviewPage {...sharedGraphProps} />} />
              <Route path="2d" element={<GraphForcePage {...sharedGraphProps} />} />
              <Route path="3d" element={<GraphForceGraph3DPage {...sharedGraphProps} />} />
              <Route path="sunburst" element={<GraphSunburstPage {...sharedGraphProps} />} />
              <Route path="treemap" element={<GraphTreemapPage {...sharedGraphProps} />} />
              <Route path="schema" element={<GraphSchemaExplorerPage {...sharedGraphProps} />} />
              <Route path="degree" element={<GraphDegreeDistributionPage {...sharedGraphProps} />} />
              <Route path="matrix" element={<GraphRelationshipMatrixPage {...sharedGraphProps} />} />
              <Route path="table" element={<GraphPropertyTablePage {...sharedGraphProps} />} />
              <Route path="*" element={<Navigate to="overview" replace />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
}
