import React, { useEffect, useMemo, useRef, useState } from 'react';
import { InteractiveNvlWrapper } from '@neo4j-nvl/react';
import { CircleAlert, FileText, FolderOpen, Link2, Pencil } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { GraphNodeCrudModal } from '../../components/crud';
import { filterGraphData } from './filterGraphData';
import { capGraphData } from './graphDisplayData';
import { getNodeTypeColor, getRelationshipTypeColor, withAlpha } from './colorSystem';

function getNodeRadius(node) {
  const base = Math.max(1, Number(node?.size || node?.degree || 1));
  return Math.max(26, Math.min(46, 26 + Math.log2(base + 1) * 7));
}

function normalizeNodeMeta(node, folderId) {
  return {
    folderName: node.folder_name || node.folderName || node.folder || null,
    fileName: node.file_name || node.fileName || node.source_file || node.sourceFile || node.document_name || node.documentName || null,
    folderId: node.folder_id || node.folderId || folderId || null,
    description: node.description || node.summary || node.notes || null,
  };
}

export default function GraphNVLPage({
  folderId,
  graphData: graphDataProp = { nodes: [], links: [] },
  nodeTypeFilters,
  relationshipTypeFilters,
  nodeTypeColors = {},
  relationshipTypeColors = {},
  minDegree,
  showOrphans,
  nodeSearch,
  searchResultIds = null,
  highlightedNodeIds = new Set(),
  highlightedLinkIds = new Set(),
  displayGraphData = null,
  traversalModeActive = false,
  traversalPath = [],
  showNodeLabels = false,
  showRelationshipLabels = false,
  jumpRequest = null,
  onTraversalNodeClick = null,
  onJumpHandled = null,
  onStatsChange,
  addNodeSignal,
  resetPinnedSignal = 0,
  resetViewSignal = 0,
}) {
  const nvlRef = useRef(null);
  const containerRef = useRef(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedRelationshipId, setSelectedRelationshipId] = useState(null);
  const [crudOpen, setCrudOpen] = useState(false);
  const [crudMode, setCrudMode] = useState('create');

  const activeGraphData = traversalModeActive
    ? displayGraphData || graphDataProp || { nodes: [], links: [] }
    : graphDataProp || { nodes: [], links: [] };

  const filteredGraph = useMemo(
    () =>
      filterGraphData(activeGraphData, {
        nodeTypeFilters,
        relationshipTypeFilters,
        minDegree,
        showOrphans,
        nodeSearch,
        searchResultIds,
      }),
    [
      activeGraphData,
      nodeTypeFilters,
      relationshipTypeFilters,
      minDegree,
      showOrphans,
      nodeSearch,
      searchResultIds,
    ]
  );

  const renderedGraph = useMemo(() => capGraphData(filteredGraph, 4000), [filteredGraph]);

  useEffect(() => {
    onStatsChange?.({
      nodes: renderedGraph.nodes.length,
      links: renderedGraph.links.length,
    });
  }, [renderedGraph.nodes.length, renderedGraph.links.length, onStatsChange]);

  const nodeLookup = useMemo(
    () => new Map(renderedGraph.nodes.map((node) => [String(node.id), node])),
    [renderedGraph.nodes]
  );

  const relationshipLookup = useMemo(
    () => new Map(renderedGraph.links.map((link) => [String(link.id), link])),
    [renderedGraph.links]
  );

  const nvlNodes = useMemo(() => {
    const hasHighlights = highlightedNodeIds.size > 0 || highlightedLinkIds.size > 0;

    return renderedGraph.nodes.map((node) => {
      const type = node.type || 'Unknown';
      const color = getNodeTypeColor(type, nodeTypeColors);
      const isHighlighted = highlightedNodeIds.has(String(node.id));
      const isSelected = String(selectedNodeId) === String(node.id);

      return {
        id: String(node.id),
        caption: showNodeLabels ? (node.name || String(node.id)) : undefined,
        color: hasHighlights && !isHighlighted ? withAlpha(color, '55') : color,
        size: getNodeRadius(node),
        selected: isSelected || isHighlighted,
        pinned: false,
      };
    });
  }, [renderedGraph.nodes, nodeTypeColors, highlightedNodeIds, highlightedLinkIds, selectedNodeId, showNodeLabels]);

  const nvlRelationships = useMemo(() => {
    const hasHighlights = highlightedNodeIds.size > 0 || highlightedLinkIds.size > 0;

    return renderedGraph.links.map((link) => {
      const type = link.type || 'Unknown';
      const sourceId = String(typeof link.source === 'object' ? link.source.id : link.source);
      const targetId = String(typeof link.target === 'object' ? link.target.id : link.target);
      const baseColor = link.properties?.isPredicted
        ? '#ec4899'
        : getRelationshipTypeColor(type, relationshipTypeColors);
      const isHighlighted = highlightedLinkIds.has(String(link.id));

      return {
        id: String(link.id),
        from: sourceId,
        to: targetId,
        type,
        caption: showRelationshipLabels ? type : undefined,
        color: link.properties?.isPredicted
          ? '#ec4899'
          : hasHighlights
            ? (isHighlighted ? withAlpha(baseColor, 'DD') : withAlpha(baseColor, '35'))
            : withAlpha(baseColor, 'AA'),
        width: link.properties?.isPredicted ? 3 : (isHighlighted ? 2.5 : 1.6),
        selected: isHighlighted || String(selectedRelationshipId) === String(link.id),
      };
    });
  }, [
    renderedGraph.links,
    relationshipTypeColors,
    highlightedNodeIds,
    highlightedLinkIds,
    selectedRelationshipId,
    showRelationshipLabels,
  ]);

  const selectedNode = selectedNodeId ? nodeLookup.get(String(selectedNodeId)) || null : null;
  const selectedRelationship = selectedRelationshipId ? relationshipLookup.get(String(selectedRelationshipId)) || null : null;
  const selectedNodeMeta = selectedNode ? normalizeNodeMeta(selectedNode, folderId) : null;

  useEffect(() => {
    if (!addNodeSignal) return;
    setCrudMode('create');
    setCrudOpen(true);
  }, [addNodeSignal]);

  useEffect(() => {
    if (!selectedNodeId) return;
    if (!nodeLookup.has(String(selectedNodeId))) {
      setSelectedNodeId(null);
    }
  }, [nodeLookup, selectedNodeId]);

  useEffect(() => {
    if (!selectedRelationshipId) return;
    if (!relationshipLookup.has(String(selectedRelationshipId))) {
      setSelectedRelationshipId(null);
    }
  }, [relationshipLookup, selectedRelationshipId]);

  useEffect(() => {
    const nvl = nvlRef.current;
    if (!nvl || !renderedGraph.nodes.length) return;

    const timeout = setTimeout(() => {
      nvl.fit(renderedGraph.nodes.map((node) => String(node.id)));
    }, 120);

    return () => clearTimeout(timeout);
  }, [renderedGraph.nodes.length, renderedGraph.links.length]);

  useEffect(() => {
    const nvl = nvlRef.current;
    if (!nvl) return;

    nvl.unPinNode(renderedGraph.nodes.map((node) => String(node.id)));
    nvl.restart(undefined, false);
  }, [resetPinnedSignal, renderedGraph.nodes]);

  useEffect(() => {
    const nvl = nvlRef.current;
    if (!nvl) return;

    setSelectedNodeId(null);
    setSelectedRelationshipId(null);
    nvl.deselectAll();
    nvl.unPinNode(renderedGraph.nodes.map((node) => String(node.id)));
    nvl.resetZoom();
    if (renderedGraph.nodes.length) {
      setTimeout(() => {
        nvl.fit(renderedGraph.nodes.map((node) => String(node.id)));
      }, 80);
    }
  }, [resetViewSignal, renderedGraph.nodes]);

  useEffect(() => {
    if (!jumpRequest?.nodeId) return;
    const nvl = nvlRef.current;
    const nodeId = String(jumpRequest.nodeId);

    if (!nvl || !nodeLookup.has(nodeId)) {
      onJumpHandled?.();
      return;
    }

    setSelectedNodeId(nodeId);
    setSelectedRelationshipId(null);
    nvl.fit([nodeId]);
    onJumpHandled?.();
  }, [jumpRequest, nodeLookup, onJumpHandled]);

  const mouseEventCallbacks = useMemo(
    () => ({
      onHover: () => {
        const container = nvlRef.current?.getContainer?.() || containerRef.current;
        if (container) {
          container.style.cursor = 'pointer';
        }
      },
      onNodeClick: (node) => {
        setSelectedNodeId(String(node.id));
        setSelectedRelationshipId(null);
        if (traversalModeActive && onTraversalNodeClick) {
          onTraversalNodeClick({ id: String(node.id) });
        }
      },
      onNodeDoubleClick: (node) => {
        setSelectedNodeId(String(node.id));
        setSelectedRelationshipId(null);
        setCrudMode('edit');
        setCrudOpen(true);
      },
      onRelationshipClick: (relationship) => {
        setSelectedRelationshipId(String(relationship.id));
        setSelectedNodeId(null);
      },
      onCanvasClick: () => {
        setSelectedNodeId(null);
        setSelectedRelationshipId(null);
      },
      onPan: true,
      onZoomAndPan: true,
      onDragStart: true,
      onDrag: true,
      onDragEnd: true,
    }),
    [onTraversalNodeClick, traversalModeActive]
  );

  const interactionOptions = useMemo(
    () => ({
      selectOnClick: true,
      drawShadowOnHover: true,
      excludeNodeMargin: false,
    }),
    []
  );

  if (!renderedGraph.nodes.length) {
    return (
      <div className="flex h-full items-center justify-center rounded-[26px] border border-dashed border-border/60 bg-background/60">
        <div className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card/90 px-4 py-3 text-sm text-muted-foreground shadow-sm">
          <CircleAlert className="h-4 w-4 text-emerald-600" />
          <span>{traversalModeActive && traversalPath.length ? 'No nodes in this traversal slice.' : 'No nodes match the current graph filters.'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[26px] border border-border/60 bg-background">
      <div ref={containerRef} className="h-full w-full">
        <InteractiveNvlWrapper
          ref={nvlRef}
          className="h-full w-full"
          nodes={nvlNodes}
          rels={nvlRelationships}
          layout="forceDirected"
          mouseEventCallbacks={mouseEventCallbacks}
          interactionOptions={interactionOptions}
          nvlOptions={{
            disableTelemetry: true,
            renderer: 'canvas',
            initialZoom: 0.75,
            minZoom: 0.15,
            maxZoom: 4,
            allowDynamicMinZoom: true,
            layoutTolerance: 0.001,
          }}
          layoutOptions={{
            springLength: 90,
            springStrength: 0.02,
            charge: -900,
            gravity: 0.03,
          }}
        />
      </div>

      {selectedNode ? (
        <div className="absolute bottom-4 left-4 w-[320px] rounded-2xl border border-border/60 bg-card/94 p-4 shadow-[0_14px_34px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-700">NVL node</div>
              <div className="mt-1 truncate text-sm font-semibold text-slate-900">{selectedNode.name || selectedNode.id}</div>
              <div className="mt-1 text-xs text-muted-foreground">{selectedNode.type || 'Unknown'}</div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="gap-1 rounded-full"
              onClick={() => {
                setCrudMode('edit');
                setCrudOpen(true);
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          </div>

          <div className="mt-3 space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-3.5 w-3.5 text-emerald-700" />
              <span>{selectedNodeMeta?.folderName || `Folder ${selectedNodeMeta?.folderId || folderId || '-'}`}</span>
            </div>
            {selectedNodeMeta?.fileName ? (
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-emerald-700" />
                <span>{selectedNodeMeta.fileName}</span>
              </div>
            ) : null}
            <div>Degree {selectedNode.degree || 0}</div>
            {selectedNodeMeta?.description ? (
              <div className="line-clamp-3 rounded-xl border border-border/50 bg-background/70 px-3 py-2">
                {selectedNodeMeta.description}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {selectedRelationship ? (
        <div className="absolute bottom-4 right-4 w-[300px] rounded-2xl border border-border/60 bg-card/94 p-4 shadow-[0_14px_34px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-700">NVL relationship</div>
          <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Link2 className="h-4 w-4 text-emerald-700" />
            <span>{selectedRelationship.type || 'Relationship'}</span>
          </div>
          <div className="mt-3 space-y-1 text-xs text-muted-foreground">
            <div>From {nodeLookup.get(String(typeof selectedRelationship.source === 'object' ? selectedRelationship.source.id : selectedRelationship.source))?.name || (typeof selectedRelationship.source === 'object' ? selectedRelationship.source.id : selectedRelationship.source)}</div>
            <div>To {nodeLookup.get(String(typeof selectedRelationship.target === 'object' ? selectedRelationship.target.id : selectedRelationship.target))?.name || (typeof selectedRelationship.target === 'object' ? selectedRelationship.target.id : selectedRelationship.target)}</div>
            <div>{selectedRelationship.properties?.isPredicted ? 'Predicted link' : 'Existing relationship'}</div>
          </div>
        </div>
      ) : null}

      <GraphNodeCrudModal
        open={crudOpen}
        mode={crudMode}
        folderId={folderId}
        initialNode={selectedNode}
        onClose={() => setCrudOpen(false)}
        onSuccess={() => setCrudOpen(false)}
      />
    </div>
  );
}
