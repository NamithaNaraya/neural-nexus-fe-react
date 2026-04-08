import React from 'react';
import { Layers3, Network, Sparkles, Zap } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/Card';

export function BrowseHero({ totalKnownNodes, totalTypes, currentFolderName }) {
  const stats = [
    { label: 'Known nodes', value: totalKnownNodes.toLocaleString(), icon: Network },
    { label: 'Entity types', value: totalTypes.toLocaleString(), icon: Layers3 },
    { label: 'Workspace', value: currentFolderName || 'All folders', icon: Sparkles },
  ];

  return (
    <div className="relative overflow-hidden rounded-[32px] border border-border/50 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.12),_transparent_45%),radial-gradient(circle_at_top_right,_rgba(20,184,166,0.12),_transparent_45%),linear-gradient(135deg,rgba(15,23,42,0.02),rgba(16,185,129,0.04))] p-6 sm:p-8">
      <div className="absolute inset-0 opacity-60">
        <div className="absolute -left-16 top-4 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl animate-pulse" />
        <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-teal-500/10 blur-3xl" />
      </div>

      <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.24em] text-emerald-700 shadow-sm backdrop-blur dark:text-emerald-400">
            <Zap className="h-3.5 w-3.5" />
            Browse Studio
          </div>

          <div className="space-y-4">
            <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
              Unified exploration for the knowledge graph.
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
              Switch between Gallery, Stream, and Table layouts instantly while maintaining a persistent filter context across the entire dataset.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          {stats.map(({ label, value, icon: Icon }) => (
            <Card key={label} variant="branded" className="bg-card/70 shadow-xl backdrop-blur-2xl">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
                  <p className="truncate text-xl font-bold text-slate-900 dark:text-slate-50">{value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
