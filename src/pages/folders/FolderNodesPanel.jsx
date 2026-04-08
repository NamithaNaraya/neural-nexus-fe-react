import React from 'react';
import { Loader2 } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';
import { cn } from '../../utils/cn';
import { getNodeTypeColor, withAlpha } from '../graph/colorSystem';

export function FolderNodesPanel({
  active,
  folderContentSearch,
  setFolderContentSearch,
  nodeTypes,
  selectedNodeType,
  setSelectedNodeType,
  selectedFolder,
  nodeSearch,
  setNodeSearch,
  fetchFolderNodes,
  nodesLoading,
  filteredFolderNodes,
}) {
  return (
    <section
      aria-hidden={!active}
      className={cn(
        'absolute inset-0 rounded-2xl border border-border/30 bg-background/70 p-4 transition-opacity duration-200 ease-out motion-reduce:transition-none',
        active
          ? 'z-10 opacity-100'
          : 'z-0 pointer-events-none opacity-0'
      )}
    >
      <div className="flex h-full min-h-0 flex-col gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-sm font-semibold">Graph nodes</h3>
          <p className="text-xs text-muted-foreground">Pick a type and search within the selected folder.</p>
        </div>
        <Input
          value={folderContentSearch}
          onChange={(e) => setFolderContentSearch(e.target.value)}
          placeholder="Search nodes..."
          className="h-10 w-full lg:max-w-sm"
        />
        </div>

        <div className="flex flex-wrap gap-2">
          {nodeTypes.length > 0 ? nodeTypes.map((nodeType) => {
            const typeColor = getNodeTypeColor(nodeType.type);
            const isSelected = selectedNodeType === nodeType.type;
            return (
              <button
                key={nodeType.type}
                type="button"
                onClick={() => {
                  setSelectedNodeType(nodeType.type);
                  fetchFolderNodes(selectedFolder.id, nodeType.type, 1, nodeSearch);
                }}
                className={cn(
                  'rounded-xl border px-3 py-1 text-[10px] font-bold transition-all duration-200',
                  isSelected
                    ? 'text-white shadow-md'
                    : 'border-border/40 bg-muted/20 text-muted-foreground hover:bg-muted/40'
                )}
                style={isSelected ? { backgroundColor: typeColor, borderColor: typeColor } : {}}
              >
                {nodeType.type} ({nodeType.count})
              </button>
            );
          }) : (
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">No types found.</span>
          )}
        </div>

        <div className="relative flex-1 min-h-0 space-y-2 overflow-y-auto pr-1">
          {nodesLoading && filteredFolderNodes.length > 0 && (
            <div className="sticky top-0 z-10 flex items-center justify-end pb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-card/90 px-2.5 py-1 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur-sm">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                Updating
              </span>
            </div>
          )}

          {nodesLoading && filteredFolderNodes.length === 0 ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((x) => (
                <Skeleton key={x} className="h-10 rounded-lg" />
              ))}
            </div>
          ) : filteredFolderNodes.length > 0 ? (
            filteredFolderNodes.map((node) => (
              <div key={node.id} className="rounded-xl border border-border/10 bg-muted/5 px-2.5 py-1.5 transition-all hover:bg-muted/10 group">
                <div className="truncate text-[12px] font-bold text-foreground/80 group-hover:text-primary transition-colors">{node.name}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                   <div 
                     className="w-1.5 h-1.5 rounded-full" 
                     style={{ backgroundColor: getNodeTypeColor(node.type) }}
                   />
                   <div className="truncate text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">{node.type}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-border/20 bg-muted/10 p-4 text-sm text-muted-foreground">
              No matching nodes found.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
