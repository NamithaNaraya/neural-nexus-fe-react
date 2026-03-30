import React from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

function resolveId(value) {
  if (!value) return '';
  return typeof value === 'object' ? value.id || value.name || '' : value;
}

export function GraphFocusConnections({ links = [], onSelectLink }) {
  if (!links.length) return null;

  return (
    <Card className="border-border/60 bg-card/60 shadow-sm">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">Connections</h3>
            <p className="text-xs text-muted-foreground">Pick a relationship to inspect it one by one.</p>
          </div>
          <Badge variant="outline">{links.length}</Badge>
        </div>

        <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
          {links.map((link, index) => (
            <button
              key={`${link.id || index}-${resolveId(link.source)}-${resolveId(link.target)}-${link.type || 'Unknown'}`}
              type="button"
              onClick={() => onSelectLink?.(link)}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-border/40 bg-background/50 px-3 py-2 text-left transition hover:border-primary/30 hover:bg-background"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{link.type || 'Relationship'}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {resolveId(link.source)} {'->'} {resolveId(link.target)}
                </div>
              </div>
              <span className="shrink-0 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">View</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
