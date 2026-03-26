import React from 'react';
import { Dna, GitFork, Layers3, Network } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Card, CardContent } from '../../../components/ui/Card';
import { cn } from '../../../utils/cn';
import { getNodeDescription, getNodeName, getNodePropertyCount, getNodeType, getTypeStyle } from '../helpers';

export function GalleryView({ nodes }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {nodes.map((node, index) => {
        const type = getNodeType(node);
        const style = getTypeStyle(type);

        return (
          <Card
            key={node.id || `${type}-${index}`}
            className="group relative overflow-hidden border-border/60 bg-card/70 shadow-lg shadow-slate-900/5 backdrop-blur-xl"
          >
            <div className={cn('absolute inset-x-0 top-0 h-24 bg-gradient-to-br opacity-80', style.glow)} />
            <CardContent className="relative space-y-4 p-5">
              <div className="flex items-start gap-4">
                <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border', style.icon)}>
                  <Dna className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-base font-semibold">{getNodeName(node)}</h3>
                    <Badge className={style.chip}>{type}</Badge>
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{getNodeDescription(node)}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-2xl border border-border/40 bg-background/40 p-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Network className="h-3.5 w-3.5" />
                    <span className="text-[11px] uppercase tracking-[0.18em]">Degree</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold">{node.degree ?? 0}</p>
                </div>
                <div className="rounded-2xl border border-border/40 bg-background/40 p-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Layers3 className="h-3.5 w-3.5" />
                    <span className="text-[11px] uppercase tracking-[0.18em]">Fields</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold">{getNodePropertyCount(node)}</p>
                </div>
                <div className="rounded-2xl border border-border/40 bg-background/40 p-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <GitFork className="h-3.5 w-3.5" />
                    <span className="text-[11px] uppercase tracking-[0.18em]">ID</span>
                  </div>
                  <p className="mt-2 truncate text-sm font-semibold">{node.id || 'n/a'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
