import React from 'react';
import { LifeBuoy } from 'lucide-react';
import { HelpQuickStart } from './components/HelpQuickStart';
import { HelpWorkflows } from './components/HelpWorkflows';

export default function HelpPage() {
  return (
    <div className="space-y-8 pb-8">
      <section className="relative overflow-hidden rounded-[34px] border border-border/60 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_34%),radial-gradient(circle_at_top_right,rgba(236,72,153,0.12),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.96),rgba(247,249,252,0.92))] p-8 shadow-[0_25px_80px_-45px_rgba(15,23,42,0.4)] dark:bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_34%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.14),transparent_28%),linear-gradient(135deg,rgba(15,23,42,0.92),rgba(17,24,39,0.9))]">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            <LifeBuoy className="h-3.5 w-3.5" />
            Help Center
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground">
            Platform guidance for upload, graph, chat, and analytics
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
            This page focuses on what users actually need in Neural Nexus: how to move through folders, ingest data,
            explore graph views, run algorithms, and get better answers from the platform.
          </p>
        </div>
      </section>

      <HelpQuickStart />
      <HelpWorkflows />
    </div>
  );
}
