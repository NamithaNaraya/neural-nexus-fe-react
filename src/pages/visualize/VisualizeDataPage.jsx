import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { useGlobalFolder } from '../../contexts/GlobalFolderContext';
import { usePredictedLinks } from '../../contexts/PredictedLinksContext';
import { graphService } from '../../services/graphService';
import { GraphViewsNavigation } from '../graph/GraphViewsNavigation';
import { visualizeDataSections } from '../graph/graphViewSections';
import { mergePredictedLinks } from '../graph/mergePredictedLinks';
import { VisualizePageSkeleton } from '../../components/skeletons/RoutePageSkeleton';

const GraphSunburstPage = lazy(() => import('../graph/GraphSunburstPage'));
const GraphTreemapPage = lazy(() => import('../graph/GraphTreemapPage'));
const GraphSchemaExplorerPage = lazy(() => import('../graph/GraphSchemaExplorerPage'));
const GraphDegreeDistributionPage = lazy(() => import('../graph/GraphDegreeDistributionPage'));
const GraphRelationshipMatrixPage = lazy(() => import('../graph/GraphRelationshipMatrixPage'));

export default function VisualizeDataPage() {
  const { selectedFolderId: folderId, currentFolder } = useGlobalFolder();
  const { getPredictedLinks } = usePredictedLinks();
  const [nodeSearch, setNodeSearch] = useState('');
  const [minDegree, setMinDegree] = useState(0);
  const [showOrphans, setShowOrphans] = useState(true);
  const [nodeTypeFilters, setNodeTypeFilters] = useState(new Set());
  const [relationshipTypeFilters, setRelationshipTypeFilters] = useState(new Set());
  const [nodeTypeColors, setNodeTypeColors] = useState({});
  const [relationshipTypeColors, setRelationshipTypeColors] = useState({});
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [refreshToken, setRefreshToken] = useState(0);
  const predictedLinks = useMemo(() => getPredictedLinks(folderId), [folderId, getPredictedLinks]);

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
        console.error('Failed to load visualize graph context:', error);
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

  const nodeTypes = useMemo(
    () => [...new Set((graphData.nodes || []).map((node) => node.type || 'Unknown'))].sort(),
    [graphData.nodes]
  );

  const relationshipTypes = useMemo(
    () => [...new Set((graphData.links || []).map((link) => link.type || 'Unknown'))].sort(),
    [graphData.links]
  );

  const graphDataWithPredictions = useMemo(
    () => mergePredictedLinks(graphData, predictedLinks),
    [graphData, predictedLinks]
  );

  const sharedGraphProps = {
    folderId,
    graphData: graphDataWithPredictions,
    nodeTypeFilters,
    relationshipTypeFilters,
    nodeTypeColors,
    relationshipTypeColors,
    minDegree,
    showOrphans,
    nodeSearch,
  };

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden">
      <Card className="flex-shrink-0 rounded-b-none border-b-0 border-border/60 bg-card/70 shadow-lg shadow-slate-900/5 backdrop-blur-xl">
        <CardContent className="flex items-center justify-between gap-4 p-4">
          <div className="flex min-w-0 items-center gap-3">
            <GraphViewsNavigation sections={visualizeDataSections} basePath="/visualize" />
          </div>
          <div className="hidden rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-xs font-medium text-primary md:block">
            {currentFolder?.name || 'Selected folder'}
          </div>
        </CardContent>
      </Card>

      <div className="min-h-0 flex-1 overflow-hidden rounded-b-2xl border border-t-0 border-border/60 bg-card/50">
        <div className="h-full overflow-y-auto overflow-x-hidden p-4">
          <Suspense fallback={<VisualizePageSkeleton />}>
            <Routes>
              <Route path="" element={<Navigate to="sunburst" replace />} />
              <Route path="sunburst" element={<GraphSunburstPage {...sharedGraphProps} />} />
              <Route path="treemap" element={<GraphTreemapPage {...sharedGraphProps} />} />
              <Route path="schema" element={<GraphSchemaExplorerPage {...sharedGraphProps} />} />
              <Route path="degree" element={<GraphDegreeDistributionPage {...sharedGraphProps} />} />
              <Route path="matrix" element={<GraphRelationshipMatrixPage {...sharedGraphProps} />} />
              <Route path="*" element={<Navigate to="sunburst" replace />} />
            </Routes>
          </Suspense>
        </div>
      </div>
    </div>
  );
}
