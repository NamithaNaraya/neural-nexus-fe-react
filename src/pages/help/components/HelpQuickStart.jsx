import React from 'react';
import { BrainCircuit, FolderOpen, MessageSquareText, Network, Upload } from 'lucide-react';

const steps = [
  {
    icon: FolderOpen,
    title: 'Create or choose a folder',
    description: 'Pick the dataset scope once in the header so browse, graph, analytics, upload, and chat stay aligned.',
    accent: 'from-blue-500/15 to-cyan-500/10',
  },
  {
    icon: Upload,
    title: 'Upload and ingest files',
    description: 'Add PDFs, CSVs, text, and docs so the platform extracts entities and relationships into the graph.',
    accent: 'from-emerald-500/15 to-teal-500/10',
  },
  {
    icon: Network,
    title: 'Explore the graph views',
    description: 'Use 2D, 3D, schema, treemap, and table views with shared filters to inspect your knowledge graph.',
    accent: 'from-violet-500/15 to-fuchsia-500/10',
  },
  {
    icon: BrainCircuit,
    title: 'Run analytics',
    description: 'Choose an algorithm, decide whether to run on the whole folder or selected nodes, then review the results.',
    accent: 'from-amber-500/15 to-orange-500/10',
  },
  {
    icon: MessageSquareText,
    title: 'Ask questions with AI Chat',
    description: 'Use the current folder scope in chat to get RAG answers grounded in the selected data.',
    accent: 'from-pink-500/15 to-rose-500/10',
  },
];

export function HelpQuickStart() {
  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">Quick Start</p>
        <h2 className="mt-1 text-2xl font-semibold">How to use the platform</h2>
      </div>

      <div className="grid gap-4 xl:grid-cols-5 md:grid-cols-2">
        {steps.map(({ icon: Icon, title, description, accent }) => (
          <div
            key={title}
            className="rounded-[28px] border border-border/60 bg-card/78 p-5 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.28)] backdrop-blur-xl"
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${accent}`}>
              <Icon className="h-5 w-5 text-foreground" />
            </div>
            <h3 className="mt-4 text-base font-semibold">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
