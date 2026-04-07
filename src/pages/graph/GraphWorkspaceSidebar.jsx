import React, { useMemo, useState } from 'react';
import { ChevronLeft, GitBranch, MoveRight, Network, Radar, Sparkles, Target, Waypoints, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Input, Label } from '../../components/ui/Input';
import { GraphColorFilterSection } from './components/GraphColorFilterSection';
import { GraphDataQualityPanel } from './components/GraphDataQualityPanel';
import { getNodeTypeColor, getRelationshipTypeColor } from './colorSystem';

function countActiveFilters({ nodeTypeFilters, relationshipTypeFilters, minDegree, showOrphans }) {
  let count = 0;
  count += nodeTypeFilters.size;
  count += relationshipTypeFilters.size;
  if (minDegree > 0) count += 1;
  if (!showOrphans) count += 1;
  return count;
}

function ToolChip({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-full border px-3 py-1.5 text-xs font-medium transition',
        active
          ? 'border-primary/40 bg-primary/10 text-primary'
          : 'border-border/40 bg-background/50 text-muted-foreground hover:bg-muted/60 hover:text-foreground',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function ToggleRow({ label, description, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left transition',
        active
          ? 'border-primary/30 bg-primary/8 shadow-sm'
          : 'border-border/40 bg-background/35 hover:bg-muted/50',
      ].join(' ')}
    >
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground">{label}</div>
        <div className="mt-1 text-xs text-muted-foreground">{description}</div>
      </div>
      <div
        className={[
          'ml-3 inline-flex min-w-[58px] items-center justify-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]',
          active ? 'bg-primary/12 text-primary' : 'bg-muted text-muted-foreground',
        ].join(' ')}
      >
        {active ? 'On' : 'Off'}
      </div>
    </button>
  );
}

function OptionList({ items, onPick, emptyLabel }) {
  if (!items.length) {
    return <div className="rounded-xl border border-dashed border-border/40 bg-background/30 px-3 py-3 text-xs text-muted-foreground">{emptyLabel}</div>;
  }

  return (
    <div className="space-y-1 rounded-xl border border-border/40 bg-background/40 p-2">
      {items.map((node) => (
        <button
          key={node.id}
          type="button"
          onClick={() => onPick(node)}
          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition hover:bg-muted/60"
        >
          <span className="truncate">{node.name || node.id}</span>
          <Target className="h-3.5 w-3.5 text-primary" />
        </button>
      ))}
    </div>
  );
}

function TraversalPanel({
  traversalModeActive,
  onTraversalToggle,
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-border/40 bg-background/40 p-3">
      <ToggleRow
        label="Path traversal mode"
        description="Turn it on, then click nodes in the graph to move forward and backward."
        active={traversalModeActive}
        onClick={onTraversalToggle}
      />

      <div className="rounded-xl border border-dashed border-border/40 bg-background/30 px-3 py-3 text-xs text-muted-foreground">
        The live path controls appear on the graph view when this mode is on.
      </div>
    </div>
  );
}

function HopFinderPanel({ allNodes, relationshipTypes, onOpenHopFinder }) {
  const [hopNodeQuery, setHopNodeQuery] = useState('');
  const [hopNode, setHopNode] = useState(null);
  const [hopDepth, setHopDepth] = useState(1);
  const [hopRelationshipTypes, setHopRelationshipTypes] = useState([]);

  const hopOptions = useMemo(() => {
    const query = hopNodeQuery.trim().toLowerCase();
    if (!query) return allNodes.slice(0, 8);
    return allNodes
      .filter((node) => `${node.name || ''} ${node.type || ''}`.toLowerCase().includes(query))
      .slice(0, 8);
  }, [allNodes, hopNodeQuery]);

  return (
    <div className="space-y-3 rounded-2xl border border-border/40 bg-background/40 p-3">
      <div className="flex items-center gap-2">
        <Radar className="h-4 w-4 text-primary" />
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Hop finder</div>
          <p className="mt-1 text-xs text-muted-foreground">Focus a node and open its 1, 2, or 3 hop neighborhood.</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Base node</Label>
        <Input
          value={hopNode?.name || hopNodeQuery}
          onChange={(event) => {
            setHopNode(null);
            setHopNodeQuery(event.target.value);
          }}
          onFocus={() => {
            if (hopNode?.name) setHopNodeQuery(hopNode.name);
          }}
          placeholder="Choose a node"
        />
        <OptionList
          items={hopOptions}
          onPick={(node) => {
            setHopNode(node);
            setHopNodeQuery(node.name || node.id);
          }}
          emptyLabel="No matching node found."
        />
        {!hopNodeQuery.trim() ? (
          <p className="text-[11px] text-muted-foreground">Suggested nodes are shown first, or search to narrow the list.</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Depth</Label>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3].map((depth) => (
            <ToolChip key={depth} active={hopDepth === depth} onClick={() => setHopDepth(depth)}>
              {depth} hop{depth === 1 ? '' : 's'}
            </ToolChip>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Relationship scope</Label>
        <div className="flex flex-wrap gap-2">
          {relationshipTypes.slice(0, 12).map((type) => {
            const active = hopRelationshipTypes.includes(type);
            return (
              <ToolChip
                key={type}
                active={active}
                onClick={() => {
                  setHopRelationshipTypes((current) => (
                    current.includes(type)
                      ? current.filter((item) => item !== type)
                      : [...current, type]
                  ));
                }}
              >
                {type}
              </ToolChip>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          variant="gradient"
          size="sm"
          className="gap-2"
          disabled={!hopNode?.id}
          onClick={() => onOpenHopFinder(hopNode, hopDepth, hopRelationshipTypes)}
        >
          <Radar className="h-4 w-4" />
          Open neighborhood
        </Button>
      </div>
    </div>
  );
}

function DistanceFinderPanel({ allNodes, pathLoading, pathError, pathSummary, onFindPath, onClearPath }) {
  const [pathSourceQuery, setPathSourceQuery] = useState('');
  const [pathTargetQuery, setPathTargetQuery] = useState('');
  const [pathSourceNode, setPathSourceNode] = useState(null);
  const [pathTargetNode, setPathTargetNode] = useState(null);

  const pathSourceOptions = useMemo(() => {
    const query = pathSourceQuery.trim().toLowerCase();
    if (!query) return allNodes.filter((node) => String(node.id) !== String(pathTargetNode?.id)).slice(0, 8);
    return allNodes
      .filter((node) => String(node.id) !== String(pathTargetNode?.id))
      .filter((node) => `${node.name || ''} ${node.type || ''}`.toLowerCase().includes(query))
      .slice(0, 8);
  }, [allNodes, pathSourceQuery, pathTargetNode]);

  const pathTargetOptions = useMemo(() => {
    const query = pathTargetQuery.trim().toLowerCase();
    if (!query) return allNodes.filter((node) => String(node.id) !== String(pathSourceNode?.id)).slice(0, 8);
    return allNodes
      .filter((node) => String(node.id) !== String(pathSourceNode?.id))
      .filter((node) => `${node.name || ''} ${node.type || ''}`.toLowerCase().includes(query))
      .slice(0, 8);
  }, [allNodes, pathTargetQuery, pathSourceNode]);

  return (
    <div className="space-y-3 rounded-2xl border border-border/40 bg-background/40 p-3">
      <div className="flex items-center gap-2">
        <MoveRight className="h-4 w-4 text-primary" />
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Distance finder</div>
          <p className="mt-1 text-xs text-muted-foreground">Find and focus the shortest path between two nodes.</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Source node</Label>
        <Input
          value={pathSourceNode?.name || pathSourceQuery}
          onChange={(event) => {
            setPathSourceNode(null);
            setPathSourceQuery(event.target.value);
          }}
          onFocus={() => {
            if (pathSourceNode?.name) setPathSourceQuery(pathSourceNode.name);
          }}
          placeholder="Choose a source"
        />
        <OptionList
          items={pathSourceOptions}
          onPick={(node) => {
            setPathSourceNode(node);
            setPathSourceQuery(node.name || node.id);
          }}
          emptyLabel="No matching source node found."
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Target node</Label>
        <Input
          value={pathTargetNode?.name || pathTargetQuery}
          onChange={(event) => {
            setPathTargetNode(null);
            setPathTargetQuery(event.target.value);
          }}
          onFocus={() => {
            if (pathTargetNode?.name) setPathTargetQuery(pathTargetNode.name);
          }}
          placeholder="Choose a target"
        />
        <OptionList
          items={pathTargetOptions}
          onPick={(node) => {
            setPathTargetNode(node);
            setPathTargetQuery(node.name || node.id);
          }}
          emptyLabel="No matching target node found."
        />
        {!pathSourceQuery.trim() && !pathTargetQuery.trim() ? (
          <p className="text-[11px] text-muted-foreground">Start from the suggested nodes below, or type to narrow the choices.</p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="gradient"
          size="sm"
          className="gap-2"
          disabled={!pathSourceNode?.id || !pathTargetNode?.id || pathLoading}
          onClick={() => onFindPath(pathSourceNode, pathTargetNode)}
        >
          {pathLoading ? <Sparkles className="h-4 w-4 animate-pulse" /> : <Waypoints className="h-4 w-4" />}
          Find path
        </Button>
        {pathSummary ? (
          <Button variant="ghost" size="sm" className="gap-2 rounded-full" onClick={onClearPath}>
            <X className="h-4 w-4" />
            Clear
          </Button>
        ) : null}
      </div>

      {pathError ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-600">
          {pathError}
        </div>
      ) : null}

      {pathSummary ? (
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-3 text-xs text-muted-foreground">
          <div className="font-semibold text-foreground">{pathSummary.sourceName} to {pathSummary.targetName}</div>
          <div className="mt-1">{pathSummary.length} hop{pathSummary.length === 1 ? '' : 's'} focused in the graph.</div>
        </div>
      ) : null}
    </div>
  );
}

function FiltersPanel({
  nodeTypes,
  nodeTypeFilters,
  setNodeTypeFilters,
  relationshipTypes,
  relationshipTypeFilters,
  setRelationshipTypeFilters,
  nodeTypeColors,
  setNodeTypeColors,
  relationshipTypeColors,
  setRelationshipTypeColors,
  minDegree,
  setMinDegree,
  showOrphans,
  setShowOrphans,
  onClearAllFilters,
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-border/40 bg-background/40 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">View filters</div>
          <p className="mt-1 text-xs text-muted-foreground">Use quick toggles to clean up the graph view fast.</p>
        </div>
        <Button variant="ghost" size="sm" className="rounded-full text-xs" onClick={onClearAllFilters}>
          Clear all
        </Button>
      </div>

      <div className="grid gap-2">
        <ToggleRow
          label="Connected nodes only"
          description="Hide isolated nodes and keep the graph cleaner."
          active={!showOrphans}
          onClick={() => setShowOrphans((value) => !value)}
        />
        <ToggleRow
          label="Dense view"
          description="Show stronger parts of the graph first."
          active={minDegree >= 2}
          onClick={() => setMinDegree((value) => (value >= 2 ? 0 : 2))}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <Label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Connection strength</Label>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
            {minDegree === 0 ? 'All' : `Min ${minDegree}`}
          </span>
        </div>
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

      <GraphColorFilterSection
        title="Node types"
        icon={Network}
        items={nodeTypes}
        activeItems={nodeTypeFilters}
        setActiveItems={setNodeTypeFilters}
        colorMap={nodeTypeColors}
        setColorMap={setNodeTypeColors}
        getColor={getNodeTypeColor}
      />

      <GraphColorFilterSection
        title="Relationship types"
        icon={GitBranch}
        items={relationshipTypes}
        activeItems={relationshipTypeFilters}
        setActiveItems={setRelationshipTypeFilters}
        colorMap={relationshipTypeColors}
        setColorMap={setRelationshipTypeColors}
        getColor={getRelationshipTypeColor}
      />
    </div>
  );
}

export function GraphWorkspaceSidebar({
  open = false,
  onClose,
  folderId,
  minDegree,
  setMinDegree,
  showOrphans,
  setShowOrphans,
  nodeTypes,
  nodeTypeFilters,
  setNodeTypeFilters,
  relationshipTypes,
  relationshipTypeFilters,
  setRelationshipTypeFilters,
  nodeTypeColors,
  setNodeTypeColors,
  relationshipTypeColors,
  setRelationshipTypeColors,
  allNodes = [],
  onClearAllFilters,
  onFindPath,
  onOpenHopFinder,
  pathLoading = false,
  pathError = '',
  pathSummary = null,
  onClearPath,
  traversalModeActive = false,
  traversalPathNodes = [],
  onTraversalToggle,
  onTraversalBack,
  onTraversalReset,
  activePanel = 'filters',
  panelTitle = 'Graph tools',
  panelDescription = '',
}) {
  const activeFilterCount = countActiveFilters({
    nodeTypeFilters,
    relationshipTypeFilters,
    minDegree,
    showOrphans,
  });

  if (!open) return null;

  return (
    <Card className="absolute left-2 top-full z-30 mt-3 flex w-[min(360px,calc(100vw-3rem))] max-h-[min(calc(100vh-13rem),620px)] flex-col overflow-hidden rounded-[28px] border border-border/20 bg-card/44 shadow-[0_18px_40px_rgba(15,23,42,0.05)] backdrop-blur-2xl">
      <CardContent className="flex min-h-0 flex-1 flex-col gap-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-700">{panelTitle}</div>
            <p className="max-w-[220px] text-xs leading-5 text-muted-foreground">
              {panelDescription || (activeFilterCount > 0 ? `${activeFilterCount} active view controls in this tool.` : 'Each tool controls one part of the graph workspace.')}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 rounded-full border border-border/60 bg-background px-3 text-xs text-muted-foreground"
            type="button"
            onClick={onClose}
          >
            <ChevronLeft className="h-4 w-4" />
            Close
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pr-2 pb-4 animate-in fade-in-0 duration-200">
          {activePanel === 'filters' ? (
            <FiltersPanel
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
              minDegree={minDegree}
              setMinDegree={setMinDegree}
              showOrphans={showOrphans}
              setShowOrphans={setShowOrphans}
              onClearAllFilters={onClearAllFilters}
            />
          ) : null}

          {activePanel === 'traversal' ? (
            <TraversalPanel
              traversalModeActive={traversalModeActive}
              onTraversalToggle={onTraversalToggle}
            />
          ) : null}

          {activePanel === 'hop' ? (
            <HopFinderPanel
              allNodes={allNodes}
              relationshipTypes={relationshipTypes}
              onOpenHopFinder={onOpenHopFinder}
            />
          ) : null}

          {activePanel === 'distance' ? (
            <DistanceFinderPanel
              allNodes={allNodes}
              pathLoading={pathLoading}
              pathError={pathError}
              pathSummary={pathSummary}
              onFindPath={onFindPath}
              onClearPath={onClearPath}
            />
          ) : null}

          {activePanel === 'quality' ? (
            <GraphDataQualityPanel folderId={folderId} />
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
