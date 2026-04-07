import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Database, FolderOpen, Network } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { Card, CardContent } from '../../../../components/ui/Card';
import { cn } from '../../../../utils/cn';
import { DataSelectionModal } from './DataSelectionModal';

export function DataScopeCard({
  collapsed,
  onToggleCollapsed,
  currentFolder,
  graphStats,
  nodeTypes,
  relationshipTypes,
  folderNodes,
  folderLinks,
  runFullFolder,
  setRunFullFolder,
  selectedNodes,
  toggleNode,
  clearSelection,
}) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Card className="border-border/60 bg-card/70 shadow-lg shadow-slate-900/5 backdrop-blur-xl">
        <CardContent className="space-y-2.5 p-3">
          <div className="space-y-0.5">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Step 2</div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">Choose data</h2>
                <p className="text-xs text-muted-foreground">Whole folder on, or custom popup.</p>
              </div>
              <button
                type="button"
                onClick={onToggleCollapsed}
                className="rounded-lg border border-border/50 bg-background/70 p-1.5 text-muted-foreground transition hover:text-foreground"
                aria-label={collapsed ? 'Expand setup panels' : 'Collapse setup panels'}
              >
                {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {collapsed ? (
            <div className="rounded-xl border border-border/40 bg-background/35 px-3 py-2 text-xs text-muted-foreground">
              {runFullFolder
                ? `${graphStats.nodes.toLocaleString()} nodes and ${graphStats.links.toLocaleString()} relations in the full folder.`
                : `${selectedNodes.length} selected node${selectedNodes.length === 1 ? '' : 's'} in custom mode.`}
            </div>
          ) : (
            <>
          <div className="rounded-xl border border-border/40 bg-background/40 p-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <FolderOpen className="h-4 w-4 text-primary" />
              {currentFolder?.name || 'No folder selected'}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-border/30 bg-background/60 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Nodes</p>
                <p className="mt-1 text-sm font-semibold">{graphStats.nodes.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border border-border/30 bg-background/60 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Relations</p>
                <p className="mt-1 text-sm font-semibold">{graphStats.links.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border/40 bg-background/35 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Run whole folder</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Turn off for custom nodes.</p>
              </div>
              <button
                type="button"
                onClick={() => setRunFullFolder((current) => !current)}
                className={cn('relative h-6 w-11 rounded-full transition', runFullFolder ? 'bg-emerald-500' : 'bg-muted')}
              >
                <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white transition', runFullFolder ? 'left-[22px]' : 'left-0.5')} />
              </button>
            </div>

            {!runFullFolder && (
              <div className="mt-3 space-y-2">
                <Button variant="outline" className="w-full" onClick={() => setModalOpen(true)}>
                  Open custom data popup
                </Button>
                <div className="rounded-xl border border-border/30 bg-background/60 px-3 py-2.5">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Database className="h-4 w-4 text-primary" />
                    {selectedNodes.length} selected node{selectedNodes.length === 1 ? '' : 's'}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">Use the popup filters to pick nodes.</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-border/40 bg-background/35 p-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Network className="h-4 w-4 text-primary" />
                Node types
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {nodeTypes.slice(0, 6).map((type) => (
                  <span key={type} className="rounded-full border border-border/50 bg-background/70 px-2 py-0.5 text-[10px] text-muted-foreground">
                    {type}
                  </span>
                ))}
                {nodeTypes.length > 6 && (
                  <span className="rounded-full border border-border/50 bg-background/70 px-2 py-0.5 text-[10px] text-muted-foreground">
                    +{nodeTypes.length - 6}
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border/40 bg-background/35 p-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Network className="h-4 w-4 text-primary" />
                Relationship types
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {relationshipTypes.slice(0, 6).map((type) => (
                  <span key={type} className="rounded-full border border-border/50 bg-background/70 px-2 py-0.5 text-[10px] text-muted-foreground">
                    {type}
                  </span>
                ))}
                {relationshipTypes.length > 6 && (
                  <span className="rounded-full border border-border/50 bg-background/70 px-2 py-0.5 text-[10px] text-muted-foreground">
                    +{relationshipTypes.length - 6}
                  </span>
                )}
              </div>
            </div>
          </div>
            </>
          )}
        </CardContent>
      </Card>

      <DataSelectionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        nodes={folderNodes}
        links={folderLinks}
        nodeTypes={nodeTypes}
        relationshipTypes={relationshipTypes}
        selectedNodes={selectedNodes}
        toggleNode={toggleNode}
        clearSelection={clearSelection}
      />
    </>
  );
}
