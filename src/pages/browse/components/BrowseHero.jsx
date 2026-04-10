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
    <section aria-labelledby="browse-page-title" className="relative overflow-hidden rounded-[32px] border border-border/50 bg-[radial-gradient(circle_at_top_left,_rgba(25,119,65,0.1),_transparent_45%),radial-gradient(circle_at_top_right,_rgba(149,201,172,0.14),_transparent_45%),linear-gradient(135deg,rgba(250,251,251,0.96),rgba(149,201,172,0.06))] p-6 sm:p-8 dark:bg-[radial-gradient(circle_at_top_left,_rgba(149,201,172,0.08),_transparent_45%),radial-gradient(circle_at_top_right,_rgba(124,172,148,0.12),_transparent_45%),linear-gradient(135deg,rgba(14,32,22,0.92),rgba(20,46,31,0.96))]">
      <div className="absolute inset-0 opacity-60">
        <div className="absolute -left-16 top-4 h-48 w-48 rounded-full bg-primary/10 blur-3xl animate-pulse" />
        <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-secondary/20 blur-3xl" />
      </div>

      <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.24em] text-primary shadow-sm backdrop-blur">
            <Zap className="h-3.5 w-3.5" />
            Browse Studio
          </div>

          <div className="space-y-4">
            <h1 id="browse-page-title" className="max-w-3xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Unified exploration for the knowledge graph.
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-lg">
              Switch between Gallery, Stream, and Table layouts instantly while maintaining a persistent filter context across the entire dataset.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          {stats.map(({ label, value, icon: Icon }) => (
            <Card key={label} variant="branded" className="bg-card/70 shadow-xl backdrop-blur-2xl">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
                  <p className="truncate text-xl font-bold text-foreground">{value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
