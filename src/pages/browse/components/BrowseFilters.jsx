import React from 'react';
import { ArrowDownAZ, Blocks, LayoutGrid, Rows3, Search, Table2 } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Input, Label } from '../../../components/ui/Input';
import { cn } from '../../../utils/cn';
import { SORT_OPTIONS, VIEW_OPTIONS } from '../constants';

const viewIcons = {
  gallery: LayoutGrid,
  stream: Rows3,
  table: Table2,
  groups: Blocks,
};

function Field({ label, children }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Select({ value, onChange, className = '', children }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className={cn(
        'h-11 w-full rounded-xl border border-border/60 bg-background/70 px-3 text-sm outline-none backdrop-blur-sm transition focus:border-primary/40 focus:ring-2 focus:ring-primary/20',
        className
      )}
    >
      {children}
    </select>
  );
}

export function BrowseFilters({
  query,
  setQuery,
  activeType,
  setActiveType,
  sortMode,
  setSortMode,
  nodeTypes,
  viewMode,
  setViewMode,
}) {
  return (
    <Card className="overflow-hidden border-border/60 bg-card/70 shadow-xl shadow-slate-900/5 backdrop-blur-xl">
      <div className="border-b border-border/40 bg-gradient-to-r from-emerald-500/10 via-sky-500/10 to-fuchsia-500/10 px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Unified filters</p>
            <p className="text-xs text-muted-foreground">Every view reads from the same folder, type, search, and sort state.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {VIEW_OPTIONS.map((view) => {
              const Icon = viewIcons[view.id];
              const active = viewMode === view.id;

              return (
                <button
                  key={view.id}
                  type="button"
                  onClick={() => setViewMode(view.id)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition',
                    active
                      ? 'border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/20 dark:border-white dark:bg-white dark:text-slate-900'
                      : 'border-border/60 bg-background/70 text-muted-foreground hover:border-primary/30 hover:text-foreground'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {view.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <CardContent className="grid gap-4 p-6 lg:grid-cols-3">
        <div>
          <Field label="Search">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name, type, description, or any loaded property..."
                className="h-11 rounded-xl border-border/60 bg-background/70 pl-10"
              />
            </div>
          </Field>
        </div>

        <Field label="Entity type">
          <Select value={activeType} onChange={(event) => setActiveType(event.target.value)}>
            <option value="all">All types</option>
            {nodeTypes.map((item) => (
              <option key={item.type} value={item.type}>
                {item.type} ({item.count})
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Sort">
          <div className="relative">
            <ArrowDownAZ className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Select value={sortMode} onChange={(event) => setSortMode(event.target.value)} className="pl-10">
              {SORT_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        </Field>
      </CardContent>
    </Card>
  );
}
