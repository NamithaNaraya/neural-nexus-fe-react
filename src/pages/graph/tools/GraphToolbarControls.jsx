import React from 'react';
import { Link2, RotateCcw, Type } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

export function GraphToolbarControls({
  showNodeLabels,
  onToggleNodeLabels,
  showRelationshipLabels,
  onToggleRelationshipLabels,
  lockDraggedNodes,
  onToggleLockDraggedNodes,
  onResetPins,
  onResetView,
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button
        variant={showNodeLabels ? 'outline' : 'ghost'}
        size="sm"
        className="gap-2 rounded-full border border-border/50 bg-card px-3 text-xs"
        type="button"
        onClick={onToggleNodeLabels}
      >
        <Type className="h-3.5 w-3.5" />
        Names
      </Button>

      <Button
        variant={showRelationshipLabels ? 'outline' : 'ghost'}
        size="sm"
        className="gap-2 rounded-full border border-border/50 bg-card px-3 text-xs"
        type="button"
        onClick={onToggleRelationshipLabels}
      >
        <Link2 className="h-3.5 w-3.5" />
        Relations
      </Button>

      <Button
        variant={lockDraggedNodes ? 'outline' : 'ghost'}
        size="sm"
        className="rounded-full border border-border/50 bg-card px-3 text-xs"
        type="button"
        onClick={onToggleLockDraggedNodes}
      >
        {lockDraggedNodes ? 'Pinned drag' : 'Free drag'}
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="rounded-full border border-border/50 bg-card px-3 text-xs"
        type="button"
        onClick={onResetPins}
      >
        Reset Pins
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="gap-2 rounded-full border border-border/50 bg-card px-3 text-xs"
        type="button"
        onClick={onResetView}
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Reset View
      </Button>
    </div>
  );
}
