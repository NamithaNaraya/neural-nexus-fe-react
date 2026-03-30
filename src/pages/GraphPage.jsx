import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import GraphForcePage from './graph/GraphForcePage';
import GraphForceGraph3DPage from './graph/GraphForceGraph3DPage';
import GraphPropertyTablePage from './graph/GraphPropertyTablePage';
import { GraphViewsNavigation } from './graph/GraphViewsNavigation';
import { GraphWorkspaceSidebar } from './graph/GraphWorkspaceSidebar';
import { knowledgeGraphSections } from './graph/graphViewSections';
import { graphService } from '../services/graphService';
import { useGlobalFolder } from '../contexts/GlobalFolderContext';

export default function GraphPage() {
  const { selectedFolderId: folderId, currentFolder } = useGlobalFolder();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('nnv2:graph-sidebar-collapsed') === '1';
    } catch {
      return false;
    }
  });
  const [nodeSearch, setNodeSearch] = useState('');
  const [minDegree, setMinDegree] = useState(0);
  const [showOrphans, setShowOrphans] = useState(true);
  const [nodeTypeFilters, setNodeTypeFilters] = useState(new Set());
  const [relationshipTypeFilters, setRelationshipTypeFilters] = useState(new Set());
  const [nodeTypeColors, setNodeTypeColors] = useState({});
  const [relationshipTypeColors, setRelationshipTypeColors] = useState({});
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [refreshToken, setRefreshToken] = useState(0);
  const [graphStats, setGraphStats] = useState({ nodes: 0, links: 0 });
  const [addNodeSignal, setAddNodeSignal] = useState(0);

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

    const handleCrud = () => setRefreshToken((value) => value + 1);
    window.addEventListener('nnv2:graph-crud', handleCrud);
    loadGraphContext();
    return () => {
      ignore = true;
      window.removeEventListener('nnv2:graph-crud', handleCrud);
    };
  }, [folderId, refreshToken]);

  useEffect(() => {
    try {
      localStorage.setItem('nnv2:graph-sidebar-collapsed', sidebarCollapsed ? '1' : '0');
    } catch {
      // ignore local storage failures
    }
  }, [sidebarCollapsed]);

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
    onStatsChange: setGraphStats,
    addNodeSignal,
  };

  return (
    <div className="relative h-full flex flex-col">
      {!sidebarCollapsed ? (
        <div className="grid items-start gap-4 h-full xl:grid-cols-[320px_minmax(0,1fr)]">
          <div className="overflow-y-auto">
            <GraphWorkspaceSidebar
              title="Graph sidebar"
              description="These filters stay active while switching between the KG views, and they follow the selected folder."
              collapsed={sidebarCollapsed}
              onToggleCollapsed={() => setSidebarCollapsed((value) => !value)}
              currentFolder={currentFolder}
              nodeSearch={nodeSearch}
              setNodeSearch={setNodeSearch}
              minDegree={minDegree}
              setMinDegree={setMinDegree}
              showOrphans={showOrphans}
              setShowOrphans={setShowOrphans}
              nodeTypes={nodeTypes}
              nodeTypeFilters={nodeTypeFilters}
              setNodeTypeFilters={setNodeTypeFilters}
              relationshipTypes={relationshipTypes}
              relationshipTypeFilters={relationshipTypeFilters}
              setRelationshipTypeFilters={setRelationshipTypeFilters}
              nodeTypeColors={nodeTypeColors}
              setNodeTypeColors={setNodeTypeColors}
              relationshipTypeColors={relationshipTypeColors}
              setRelationshipTypeColors={setRelationshipTypeColors}
            />
          </div>

          <div className="min-w-0 flex flex-col h-full gap-0">
            <Card className="border-border/60 bg-card/70 shadow-lg shadow-slate-900/5 backdrop-blur-xl flex-shrink-0 rounded-b-none border-b-0">
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 rounded-full border border-border/40 bg-background/70 px-3 text-xs"
                    type="button"
                    onClick={() => setSidebarCollapsed(true)}
                    aria-label="Collapse filters"
                    title="Collapse filters"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                  </Button>
                  <GraphViewsNavigation sections={knowledgeGraphSections} basePath="/graph" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="hidden items-center gap-2 rounded-full border border-border/40 bg-background/60 px-3 py-1.5 text-xs text-muted-foreground md:flex">
                    <span>{Number(graphStats.nodes || 0).toLocaleString()} nodes</span>
                    <span className="text-border">•</span>
                    <span>{Number(graphStats.links || 0).toLocaleString()} relationships</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAddNodeSignal((value) => value + 1)}
                    className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-500/20 transition hover:from-blue-600 hover:to-purple-700"
                  >
                    Add Node
                  </button>
                </div>
              </CardContent>
            </Card>

            <div className="flex-1 overflow-hidden rounded-t-none rounded-b-2xl border border-t-0 border-border/60 bg-card/50 min-h-0">
              <Routes>
                <Route path="" element={<Navigate to="2d" replace />} />
                <Route path="2d" element={<GraphForcePage {...sharedGraphProps} />} />
                <Route path="3d" element={<GraphForceGraph3DPage {...sharedGraphProps} />} />
                <Route path="table" element={<GraphPropertyTablePage {...sharedGraphProps} />} />
                <Route path="*" element={<Navigate to="2d" replace />} />
              </Routes>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative flex flex-col h-full">
          <div className="space-y-0 flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between gap-4 rounded-t-2xl rounded-b-none border border-b-0 border-border/60 bg-card/70 px-4 py-3 shadow-lg shadow-slate-900/5 backdrop-blur-xl flex-shrink-0">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 rounded-full border border-border/40 bg-background/70 px-3 text-xs"
                  type="button"
                  onClick={() => setSidebarCollapsed(false)}
                  aria-label="Open filters"
                  title="Open filters"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                  </Button>
                  <GraphViewsNavigation sections={knowledgeGraphSections} basePath="/graph" />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAddNodeSignal((value) => value + 1)}
                  className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-500/20 transition hover:from-blue-600 hover:to-purple-700"
                >
                  Add Node
                </button>
                <div className="hidden items-center gap-2 rounded-full border border-border/40 bg-background/60 px-3 py-1.5 text-xs text-muted-foreground md:flex">
                  <span>{Number(graphStats.nodes || 0).toLocaleString()} nodes</span>
                  <span className="text-border">•</span>
                  <span>{Number(graphStats.links || 0).toLocaleString()} relationships</span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-hidden rounded-t-none rounded-b-2xl border border-t-0 border-border/60 bg-card/50 min-h-0">
              <Routes>
                <Route path="" element={<Navigate to="2d" replace />} />
                <Route path="2d" element={<GraphForcePage {...sharedGraphProps} />} />
                <Route path="3d" element={<GraphForceGraph3DPage {...sharedGraphProps} />} />
                <Route path="table" element={<GraphPropertyTablePage {...sharedGraphProps} />} />
                <Route path="*" element={<Navigate to="2d" replace />} />
              </Routes>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
