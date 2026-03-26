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
    <div className="relative overflow-hidden rounded-[28px] border border-border/50 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.18),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.18),_transparent_30%),linear-gradient(135deg,rgba(15,23,42,0.04),rgba(59,130,246,0.08),rgba(244,114,182,0.06))] p-6 sm:p-7">
      <div className="absolute inset-0 opacity-60">
        <div className="absolute -left-16 top-4 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      <div className="relative grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-600 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            <Zap className="h-3.5 w-3.5" />
            Browse Studio
          </div>

          <div className="space-y-3">
            <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
              Explore the graph in multiple beautiful views, with one shared filter system.
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
              Switch between visual layouts instantly, keep folder and type filters in sync, and scan the dataset without touching the V1 backend or ExtJS frontend.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {stats.map(({ label, value, icon: Icon }) => (
            <Card key={label} className="border-white/50 bg-white/55 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/30">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900/5 text-slate-700 dark:bg-white/10 dark:text-slate-100">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{label}</p>
                  <p className="truncate text-lg font-semibold text-slate-900 dark:text-slate-50">{value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
