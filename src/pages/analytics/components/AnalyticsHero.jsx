import React from 'react';
import { Cpu, PlayCircle, Sparkles } from 'lucide-react';

export function AnalyticsHero() {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-border/60 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(244,114,182,0.18),_transparent_32%),linear-gradient(140deg,rgba(15,23,42,0.05),rgba(59,130,246,0.08),rgba(16,185,129,0.06))] p-6 sm:p-7">
      <div className="absolute inset-0 opacity-70">
        <div className="absolute -left-10 top-10 h-40 w-40 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-pink-500/10 blur-3xl" />
      </div>
      <div className="relative grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            <Cpu className="h-3.5 w-3.5" />
            Algorithm Lab
          </div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Simple algorithm runner for folder data or a selected subset.
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Left side: choose folder, scope, algorithm, and quantitative weighting. Right side: results appear neatly after each run.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <div className="rounded-2xl border border-border/50 bg-background/60 px-4 py-3 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <PlayCircle className="h-4 w-4 text-primary" />
              Selected-data runs
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Choose specific nodes and run algorithms only on that subset.</p>
          </div>
          <div className="rounded-2xl border border-border/50 bg-background/60 px-4 py-3 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-primary" />
              Fast result view
            </div>
            <p className="mt-1 text-xs text-muted-foreground">See backend insight text, ranked outputs, and scope summary in one place.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
