import React, { useMemo, useState } from 'react';
import { Check, Search, X } from 'lucide-react';
import { Input } from '../../../../components/ui/Input';
import { cn } from '../../../../utils/cn';

const TYPE_COLORS = [
  'border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300',
  'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  'border-fuchsia-500/25 bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300',
  'border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-300',
  'border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300',
  'border-cyan-500/25 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
  'border-lime-500/25 bg-lime-500/10 text-lime-700 dark:text-lime-300',
];

export function DataSelectionModal({
  open,
  onClose,
  nodes,
  links,
  nodeTypes,
  relationshipTypes,
  selectedNodes,
  toggleNode,
  clearSelection,
}) {
  const [search, setSearch] = useState('');
  const [activeNodeTypes, setActiveNodeTypes] = useState([]);
  const [activeRelationshipTypes, setActiveRelationshipTypes] = useState([]);

  const visibleNodeIds = useMemo(() => {
    if (activeRelationshipTypes.length === 0) return null;
    const ids = new Set();
    links.forEach((link) => {
      if (activeRelationshipTypes.includes(link.type)) {
        ids.add(link.source);
        ids.add(link.target);
      }
    });
    return ids;
  }, [links, activeRelationshipTypes]);

  const filteredNodes = useMemo(() => {
    const term = search.trim().toLowerCase();
    return nodes.filter((node) => {
      const matchesTerm = !term || `${node.name || ''} ${node.type || ''} ${node.id || ''}`.toLowerCase().includes(term);
      const matchesType = activeNodeTypes.length === 0 || activeNodeTypes.includes(node.type);
      const matchesRelationship = !visibleNodeIds || visibleNodeIds.has(node.id);
      return matchesTerm && matchesType && matchesRelationship;
    });
  }, [nodes, search, activeNodeTypes, visibleNodeIds]);

  const nodesByType = useMemo(() => {
    return nodeTypes.map((type, index) => ({
      type,
      colorClass: TYPE_COLORS[index % TYPE_COLORS.length],
      nodes: filteredNodes.filter((node) => node.type === type),
    })).filter((group) => group.nodes.length > 0);
  }, [filteredNodes, nodeTypes]);

  if (!open) return null;

  function toggleFilter(value, values, setter) {
    setter(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  }

  function selectAllFiltered() {
    const ids = filteredNodes.map((node) => node.id);
    ids.forEach((id) => {
      if (!selectedNodes.includes(id)) toggleNode(id);
    });
  }

  function clearAllFiltered() {
    const ids = new Set(filteredNodes.map((node) => node.id));
    selectedNodes.forEach((id) => {
      if (ids.has(id)) toggleNode(id);
    });
  }

  function selectType(type) {
    filteredNodes
      .filter((node) => node.type === type)
      .forEach((node) => {
        if (!selectedNodes.includes(node.id)) toggleNode(node.id);
      });
  }

  function clearType(type) {
    filteredNodes
      .filter((node) => node.type === type && selectedNodes.includes(node.id))
      .forEach((node) => toggleNode(node.id));
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="flex h-[min(760px,92vh)] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] border border-border/60 bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/40 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold">Choose custom data</h2>
            <p className="text-sm text-muted-foreground">Filter by node type, relationship type, then pick the exact nodes to analyze.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-muted-foreground transition hover:bg-muted/50 hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[280px_1fr]">
          <div className="border-r border-border/30 bg-background/35 p-4">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Node types</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {nodeTypes.map((type, index) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleFilter(type, activeNodeTypes, setActiveNodeTypes)}
                      className={cn(
                        'rounded-full border px-3 py-1 text-xs transition',
                        activeNodeTypes.includes(type)
                          ? TYPE_COLORS[index % TYPE_COLORS.length]
                          : 'border-border/50 bg-background/70 text-muted-foreground'
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Relationship types</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {relationshipTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleFilter(type, activeRelationshipTypes, setActiveRelationshipTypes)}
                      className={cn(
                        'rounded-full border px-3 py-1 text-xs transition',
                        activeRelationshipTypes.includes(type)
                          ? 'border-primary/30 bg-primary/10 text-primary'
                          : 'border-border/50 bg-background/70 text-muted-foreground'
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border/40 bg-background/60 p-4">
                <div className="space-y-3">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold leading-none">Selected nodes</p>
                      <p className="mt-2 text-xs text-muted-foreground">{selectedNodes.length} chosen</p>
                    </div>
                    <span className="rounded-full border border-border/40 bg-background/80 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                      Quick actions
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={selectAllFiltered}
                      className="rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-3 py-2 text-left text-xs font-medium text-emerald-700 transition hover:bg-emerald-500/12"
                    >
                      Select all visible nodes
                    </button>
                    <button
                      type="button"
                      onClick={clearAllFiltered}
                      className="rounded-xl border border-amber-500/20 bg-amber-500/8 px-3 py-2 text-left text-xs font-medium text-amber-700 transition hover:bg-amber-500/12"
                    >
                      Deselect visible nodes
                    </button>
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="rounded-xl border border-rose-500/20 bg-rose-500/8 px-3 py-2 text-left text-xs font-medium text-rose-700 transition hover:bg-rose-500/12"
                    >
                      Clear all selected nodes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex min-h-0 flex-col p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search nodes by name, id, or type" className="pl-10" />
            </div>

            <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
              <div className="space-y-4">
                {nodesByType.map((group) => (
                  <div key={group.type} className="rounded-2xl border border-border/30 bg-background/20 p-3">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className={cn('rounded-full border px-3 py-1 text-xs font-semibold', group.colorClass)}>
                          {group.type}
                        </span>
                        <span className="text-xs text-muted-foreground">{group.nodes.length}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => selectType(group.type)} className="text-xs font-medium text-primary">
                          Select all
                        </button>
                        <button type="button" onClick={() => clearType(group.type)} className="text-xs font-medium text-primary">
                          Deselect all
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                      {group.nodes.map((node) => {
                        const active = selectedNodes.includes(node.id);

                        return (
                          <button
                            key={node.id}
                            type="button"
                            onClick={() => toggleNode(node.id)}
                            className={cn(
                              'rounded-2xl border px-4 py-3 text-left transition',
                              active
                                ? cn('shadow-sm', group.colorClass)
                                : 'border-border/40 bg-background/35 hover:border-primary/20 hover:bg-background/55'
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold">{node.name || node.id}</p>
                                <p className="mt-1 text-xs text-muted-foreground">{node.type || 'Entity'}</p>
                              </div>
                              <div className={cn(
                                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border',
                                active ? 'border-current bg-current text-white' : 'border-border/60 text-transparent'
                              )}>
                                <Check className="h-3.5 w-3.5" />
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {filteredNodes.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border/40 bg-background/30 px-4 py-10 text-center text-sm text-muted-foreground">
                  No nodes match the current filters.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
