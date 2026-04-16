import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BrainCircuit,
  Database,
  GitBranch,
  MessageSquareText,
  Radar,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Button } from '../components/ui/Button';

const neuralNodes = [
  { id: 1, x: '10%', y: '22%', size: 18 },
  { id: 2, x: '22%', y: '48%', size: 12 },
  { id: 3, x: '36%', y: '18%', size: 14 },
  { id: 4, x: '50%', y: '54%', size: 20 },
  { id: 5, x: '64%', y: '28%', size: 12 },
  { id: 6, x: '76%', y: '60%', size: 16 },
  { id: 7, x: '88%', y: '24%', size: 10 },
];

const neuralLinks = [
  ['10%', '22%', '22%', '48%'],
  ['22%', '48%', '36%', '18%'],
  ['36%', '18%', '50%', '54%'],
  ['50%', '54%', '64%', '28%'],
  ['64%', '28%', '76%', '60%'],
  ['64%', '28%', '88%', '24%'],
  ['22%', '48%', '50%', '54%'],
];

const highlights = [
  {
    icon: BrainCircuit,
    title: 'Graph-native AI',
    description: 'Ask grounded questions across files, entities, and relationships without losing structure.',
  },
  {
    icon: GitBranch,
    title: 'Connected knowledge',
    description: 'Turn uploads, tables, and direct logic into one searchable graph workspace.',
  },
  {
    icon: Radar,
    title: 'Visual intelligence',
    description: 'Move from folders to graph, browse, chat, and analytics in one smooth flow.',
  },
];

const quickStats = [
  { label: 'Knowledge graph', value: 'Unified' },
  { label: 'Workspace flow', value: 'Folders to insights' },
  { label: 'Experience', value: 'Pastel, calm, fast' },
];

const featureCards = [
  {
    icon: Database,
    title: 'Ingest',
    text: 'Upload files, map tables, paste text, or run direct queries into the same workspace.',
  },
  {
    icon: MessageSquareText,
    title: 'Chat',
    text: 'Get clean answers with graph context, saved history, and web support when needed.',
  },
  {
    icon: ShieldCheck,
    title: 'Operate',
    text: 'Keep teams aligned with one theme system, one workspace model, and one shared design language.',
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="relative isolate overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-8%] top-[-6%] h-[28rem] w-[28rem] rounded-full bg-primary/16 blur-3xl" />
          <div className="absolute right-[-6%] top-[8%] h-[24rem] w-[24rem] rounded-full bg-accent/16 blur-3xl" />
          <div className="absolute bottom-[-8%] left-[24%] h-[22rem] w-[22rem] rounded-full bg-primary/10 blur-3xl" />
        </div>

        <section className="mx-auto flex min-h-screen w-full max-w-[1380px] flex-col px-6 pb-10 pt-6 lg:px-10">
          <header className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-card/85 shadow-[0_16px_40px_-28px_hsl(var(--primary)/0.35)] backdrop-blur-xl">
                <BrainCircuit className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold tracking-tight">NESSO Botanica</p>
                <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Neural knowledge platform</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button as={Link} to="/login" variant="outline" className="rounded-2xl px-5">
                Sign in
              </Button>
              <Button as={Link} to="/login" variant="gradient" className="rounded-2xl px-5">
                Open workspace
              </Button>
            </div>
          </header>

          <div className="grid flex-1 items-center gap-12 py-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/18 bg-card/70 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary shadow-sm backdrop-blur-xl">
                <Sparkles className="h-3.5 w-3.5" />
                Pastel neural workspace
              </div>

              <div className="space-y-5">
                <h1 className="max-w-3xl text-5xl font-bold leading-[1.02] tracking-[-0.04em] text-foreground md:text-6xl">
                  Build calm, connected intelligence from your documents and graph data.
                </h1>
                <p className="max-w-2xl text-lg font-medium leading-8 text-muted-foreground">
                  A smoother knowledge platform for ingestion, exploration, chat, and analytics. Structured enough for enterprise work, soft enough to feel modern and effortless.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button as={Link} to="/login" variant="gradient" className="h-12 rounded-2xl px-6 text-sm font-semibold">
                  Launch platform
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button as={Link} to="/login" variant="outline" className="h-12 rounded-2xl px-6 text-sm font-semibold">
                  Explore login
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {quickStats.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[1.75rem] border border-border/60 bg-card/72 px-5 py-4 shadow-[0_24px_70px_-48px_hsl(var(--primary)/0.22)] backdrop-blur-xl"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">{item.label}</p>
                    <p className="mt-2 text-xl font-bold tracking-tight">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="hero-surface-brand relative overflow-hidden rounded-[2.5rem] border border-border/70 p-6 shadow-[0_32px_120px_-60px_hsl(var(--primary)/0.3)]">
                <div className="absolute inset-0 opacity-80">
                  <svg viewBox="0 0 100 100" className="h-full w-full">
                    {neuralLinks.map(([x1, y1, x2, y2], index) => (
                      <line
                        key={index}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="hsl(var(--primary) / 0.24)"
                        strokeWidth="0.45"
                      />
                    ))}
                  </svg>
                </div>

                <div className="absolute inset-0">
                  {neuralNodes.map((node, index) => (
                    <div
                      key={node.id}
                      className="absolute rounded-full border border-white/60 bg-card/85 shadow-[0_12px_35px_-16px_hsl(var(--primary)/0.45)] backdrop-blur-md animate-float"
                      style={{
                        left: node.x,
                        top: node.y,
                        width: `${node.size * 4}px`,
                        height: `${node.size * 4}px`,
                        transform: 'translate(-50%, -50%)',
                        animationDelay: `${index * 0.35}s`,
                      }}
                    >
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-primary/16 to-accent/14">
                        <div className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_18px_hsl(var(--primary)/0.45)]" />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="relative z-10 flex min-h-[28rem] flex-col justify-between">
                  <div className="ml-auto max-w-[18rem] rounded-[1.75rem] border border-border/60 bg-card/78 p-5 backdrop-blur-xl">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">Neural canvas</p>
                    <h2 className="mt-3 text-2xl font-bold tracking-tight">Graph, chat, and insight in one flow.</h2>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">
                      Soft visual energy, strong information structure, and a theme system that stays consistent across the product.
                    </p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    {highlights.map((item) => (
                      <div key={item.title} className="rounded-[1.5rem] border border-border/60 bg-card/76 p-4 backdrop-blur-xl">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                          <item.icon className="h-5 w-5" />
                        </div>
                        <h3 className="mt-4 text-base font-bold tracking-tight">{item.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <section className="grid gap-4 pb-6 md:grid-cols-3">
            {featureCards.map((item) => (
              <div
                key={item.title}
                className="rounded-[2rem] border border-border/60 bg-card/74 p-6 shadow-[0_24px_70px_-48px_hsl(var(--primary)/0.2)] backdrop-blur-xl"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/14 text-accent">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-xl font-bold tracking-tight">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </section>
        </section>
      </div>
    </main>
  );
}
