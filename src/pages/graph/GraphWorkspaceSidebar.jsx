import React from 'react';
import { ChevronLeft, GitBranch, Network, Search } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Input, Label } from '../../components/ui/Input';
import { GraphColorFilterSection } from './components/GraphColorFilterSection';
import { getNodeTypeColor, getRelationshipTypeColor } from './colorSystem';

export function GraphWorkspaceSidebar({
  open = false,
  onClose,
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
  if (!open) return null;

  return (
    <Card className="absolute left-4 top-20 z-30 w-[320px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-6rem)] overflow-y-auto border-border/60 bg-card/90 shadow-2xl shadow-slate-900/10 backdrop-blur-xl">
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Filters</div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 rounded-full border border-border/40 bg-background/50 px-3 text-xs"
            type="button"
            onClick={onClose}
            title="Close filters"
            aria-label="Close filters"
          >
            <ChevronLeft className="h-4 w-4" />
            Close
          </Button>
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
