import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { useGlobalFolder } from '../../contexts/GlobalFolderContext';
import { graphService } from '../../services/graphService';
import { GraphViewsNavigation } from '../graph/GraphViewsNavigation';
import { GraphWorkspaceSidebar } from '../graph/GraphWorkspaceSidebar';
import { visualizeDataSections } from '../graph/graphViewSections';
import GraphSunburstPage from '../graph/GraphSunburstPage';
import GraphTreemapPage from '../graph/GraphTreemapPage';
import GraphSchemaExplorerPage from '../graph/GraphSchemaExplorerPage';
import GraphDegreeDistributionPage from '../graph/GraphDegreeDistributionPage';
import GraphRelationshipMatrixPage from '../graph/GraphRelationshipMatrixPage';

export default function VisualizeDataPage() {
  const { selectedFolderId: folderId, currentFolder } = useGlobalFolder();
  const [nodeSearch, setNodeSearch] = useState('');
  const [minDegree, setMinDegree] = useState(0);
  const [showOrphans, setShowOrphans] = useState(true);
  const [nodeTypeFilters, setNodeTypeFilters] = useState(new Set());
  const [relationshipTypeFilters, setRelationshipTypeFilters] = useState(new Set());
  const [nodeTypeColors, setNodeTypeColors] = useState({});
  const [relationshipTypeColors, setRelationshipTypeColors] = useState({});
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [refreshToken, setRefreshToken] = useState(0);

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
        <GraphWorkspaceSidebar
          title="Visualize Data"
          description="Use the same filters here to explore sunburst, treemap, schema, degree, and matrix views without CRUD distractions."
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

        <div className="space-y-4">
          <Card className="border-border/60 bg-card/70 shadow-lg shadow-slate-900/5 backdrop-blur-xl">
            <CardContent className="p-4">
              <GraphViewsNavigation sections={visualizeDataSections} basePath="/visualize" />
            </CardContent>
          </Card>

          <div className="h-[calc(100vh-14rem)] min-h-[680px] overflow-hidden rounded-2xl border border-border/60 bg-card/50">
            <Routes>
              <Route path="" element={<Navigate to="sunburst" replace />} />
              <Route path="sunburst" element={<GraphSunburstPage {...sharedGraphProps} />} />
              <Route path="treemap" element={<GraphTreemapPage {...sharedGraphProps} />} />
              <Route path="schema" element={<GraphSchemaExplorerPage {...sharedGraphProps} />} />
              <Route path="degree" element={<GraphDegreeDistributionPage {...sharedGraphProps} />} />
              <Route path="matrix" element={<GraphRelationshipMatrixPage {...sharedGraphProps} />} />
              <Route path="*" element={<Navigate to="sunburst" replace />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
}
