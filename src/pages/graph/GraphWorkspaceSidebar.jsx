import React from 'react';
import { ChevronLeft, ChevronRight, FolderOpen, GitBranch, Network, Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Input, Label } from '../../components/ui/Input';
import { GraphColorFilterSection } from './components/GraphColorFilterSection';
import { getNodeTypeColor, getRelationshipTypeColor } from './colorSystem';

export function GraphWorkspaceSidebar({
  title = 'Graph sidebar',
  description,
  collapsed = false,
  onToggleCollapsed,
  currentFolder,
  nodeSearch,
  setNodeSearch,
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
}) {
  if (collapsed) {
    return (
      <Card className="h-fit overflow-hidden border-border/60 bg-card/80 shadow-lg shadow-slate-900/5 backdrop-blur-xl xl:sticky xl:top-4 xl:w-[88px]">
        <CardContent className="flex flex-col items-center gap-4 p-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full border border-border/40 bg-background/60"
            type="button"
            onClick={onToggleCollapsed}
            title="Open filters"
            aria-label="Open filters"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <div className="flex flex-col items-center gap-2 rounded-2xl border border-border/40 bg-background/50 px-2 py-3 text-center">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Filters
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-fit border-border/60 bg-card/70 shadow-lg shadow-slate-900/5 backdrop-blur-xl xl:sticky xl:top-4">
      <CardContent className="space-y-5 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Filters</div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 rounded-full border border-border/40 bg-background/50 px-3 text-xs"
            type="button"
            onClick={onToggleCollapsed}
            title="Collapse filters"
            aria-label="Collapse filters"
          >
            <ChevronLeft className="h-4 w-4" />
            Hide
          </Button>
        </div>

        <div className="rounded-2xl border border-border/40 bg-background/40 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <FolderOpen className="h-4 w-4 text-primary" />
            Current scope
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {currentFolder
              ? `${Number(currentFolder.node_count || 0).toLocaleString()} nodes and ${Number(currentFolder.file_count || 0).toLocaleString()} files available in this scope.`
              : 'Choose a folder in the header to load graph data.'}
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
  );
}
