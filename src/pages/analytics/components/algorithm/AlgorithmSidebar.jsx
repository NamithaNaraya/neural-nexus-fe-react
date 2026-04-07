import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import { Card, CardContent } from '../../../../components/ui/Card';
import { Input } from '../../../../components/ui/Input';
import { cn } from '../../../../utils/cn';
import { ALGORITHM_CATALOG, ALGORITHM_GROUPS } from '../../algorithmCatalog';

export function AlgorithmSidebar({ selectedAlgorithmId, setSelectedAlgorithmId }) {
  const [search, setSearch] = useState('');
  const [openGroups, setOpenGroups] = useState(() =>
    Object.fromEntries(ALGORITHM_GROUPS.map((group) => [group.id, false]))
  );

  const filteredAlgorithms = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return ALGORITHM_CATALOG;
    return ALGORITHM_CATALOG.filter((algorithm) =>
      [algorithm.name, algorithm.group, algorithm.description].some((value) =>
        value.toLowerCase().includes(term)
      )
    );
  }, [search]);

  const algorithmsByGroup = useMemo(() => {
    return ALGORITHM_GROUPS.map((group) => ({
      ...group,
      items: filteredAlgorithms.filter((algorithm) => algorithm.group === group.id),
    })).filter((group) => group.items.length > 0);
  }, [filteredAlgorithms]);

  function toggleGroup(groupId) {
    setOpenGroups((current) => ({ ...current, [groupId]: !current[groupId] }));
  }

  return (
    <Card className="flex h-full min-h-0 flex-col border-border/60 bg-card/70 shadow-lg shadow-slate-900/5 backdrop-blur-xl">
      <CardContent className="flex min-h-0 flex-1 flex-col gap-4 p-4">
        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Algorithms</div>
          <h2 className="text-base font-semibold">Choose one</h2>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search algorithms"
            className="pl-10"
          />
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          {algorithmsByGroup.map((group) => {
            const expanded = search ? true : openGroups[group.id];
            const ToggleIcon = expanded ? ChevronDown : ChevronRight;

            return (
              <div key={group.id} className="rounded-2xl border border-border/40 bg-background/30">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className={cn('h-2.5 w-2.5 rounded-full bg-current', group.accent)} />
                    <span className="text-sm font-semibold">{group.label}</span>
                    <span className="text-xs text-muted-foreground">{group.items.length}</span>
                  </div>
                  {!search && <ToggleIcon className="h-4 w-4 shrink-0 text-muted-foreground" />}
                </button>

                {expanded && (
                  <div className="space-y-1 border-t border-border/30 px-2 py-2">
                    {group.items.map((algorithm) => {
                      const active = selectedAlgorithmId === algorithm.id;
                      const Icon = algorithm.icon;

                      return (
                        <button
                          key={algorithm.id}
                          type="button"
                          onClick={() => setSelectedAlgorithmId(algorithm.id)}
                          className={cn(
                            'w-full rounded-xl border px-3 py-2.5 text-left transition',
                            active
                              ? cn('text-foreground shadow-sm', algorithm.activeClass)
                              : 'border-transparent hover:bg-background/70'
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 gap-3">
                              <div className={cn('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border bg-background/80', algorithm.chipClass)}>
                                <Icon className={cn('h-4 w-4', algorithm.iconClass)} />
                              </div>
                              <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{algorithm.name}</p>
                              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{algorithm.description}</p>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
