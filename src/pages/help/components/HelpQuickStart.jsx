import React from 'react';
import { BrainCircuit, FolderOpen, MessageSquareText, Network, Upload } from 'lucide-react';

const steps = [
  {
    icon: FolderOpen,
    title: 'Initialize Scope',
    description: 'Establish your workspace context. All browse, graph, and analytics operations stay synchronized.',
    accent: 'from-emerald-500/10 to-emerald-500/5',
    iconColor: 'text-emerald-500',
  },
  {
    icon: Upload,
    title: 'Ingest Data',
    description: 'Process raw intelligence source files into structured knowledge graph components.',
    accent: 'from-amber-500/10 to-amber-500/5',
    iconColor: 'text-amber-500',
  },
  {
    icon: Network,
    title: 'Topographic Audit',
    description: 'Conduct deep spatial analysis using 2D, 3D, and hierarchical visualization protocols.',
    accent: 'from-teal-500/10 to-teal-500/5',
    iconColor: 'text-teal-500',
  },
  {
    icon: BrainCircuit,
    title: 'Execute Logic',
    description: 'Apply topological algorithms and structural inference models to isolate patterns.',
    accent: 'from-cyan-500/10 to-cyan-500/5',
    iconColor: 'text-cyan-500',
  },
  {
    icon: MessageSquareText,
    title: 'Contextual Query',
    description: 'Leverage graph-grounded LLM intelligence to extract insights from specific source data.',
    accent: 'from-emerald-600/10 to-emerald-600/5',
    iconColor: 'text-emerald-600',
  },
];

export function HelpQuickStart() {
  return (
    <section className="space-y-6">
      <div className="px-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-600 dark:text-emerald-400 opacity-80">Onboarding Protocol</p>
        <h2 className="mt-1 text-3xl font-bold tracking-tight">System Workflow</h2>
      </div>

      <div className="grid gap-4 xl:grid-cols-5 md:grid-cols-2">
        {steps.map(({ icon: Icon, title, description, accent, iconColor }) => (
          <div
            key={title}
            className="group relative flex flex-col rounded-[32px] border border-border/50 bg-card/70 p-6 shadow-xl shadow-black/5 backdrop-blur-2xl transition-all duration-500 hover:border-emerald-500/20 hover:shadow-emerald-500/5"
          >
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ring-1 ring-border/20 transition-transform duration-500 group-hover:scale-110 ${accent}`}>
              <Icon className={`h-6 w-6 ${iconColor}`} />
            </div>
            <h3 className="mt-5 text-base font-bold text-foreground tracking-tight">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground font-medium">{description}</p>
            
            <div className="absolute top-4 right-4 h-1.5 w-1.5 rounded-full bg-border/40 transition-colors group-hover:bg-emerald-500/40" />
          </div>
        ))}
      </div>
    </section>
  );
}
