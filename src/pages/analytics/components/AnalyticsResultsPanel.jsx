import React from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/Card';
import { getDisplayName, getDisplayType, getScoreLabel } from '../helpers';

export function AnalyticsResultsPanel({ result, summary, error }) {
  return (
    <Card className="sticky top-4 border-border/60 bg-card/70 shadow-lg shadow-slate-900/5 backdrop-blur-xl">
      <CardContent className="space-y-5 p-5">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Results</h2>
          <p className="text-sm text-muted-foreground">Run the algorithm from the left panel. The output appears here.</p>
        </div>

        {error && (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
            {error}
          </div>
        )}

        {!result && !error && (
          <div className="rounded-2xl border border-dashed border-border/40 bg-background/30 px-4 py-12 text-center">
            <Sparkles className="mx-auto h-10 w-10 text-primary/60" />
            <p className="mt-4 text-sm font-semibold">No algorithm run yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Choose the folder and algorithm on the left, then click the run button.</p>
          </div>
        )}

        {result && (
          <>
            <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-background/80 text-primary">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Analysis summary</p>
                  <p className="mt-2 text-sm leading-6 text-foreground">{summary}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/40 bg-background/30">
              <div className="grid grid-cols-12 gap-2 border-b border-border/40 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <div className="col-span-1">#</div>
                <div className="col-span-5">Name</div>
                <div className="col-span-3">Type</div>
                <div className="col-span-3 text-right">Score</div>
              </div>

              <div className="max-h-[520px] overflow-y-auto">
                {(result.results || []).slice(0, 50).map((item, index) => (
                  <div key={item.id || `${index}-${getDisplayName(item)}`} className="grid grid-cols-12 gap-2 border-t border-border/30 px-4 py-3 text-sm">
                    <div className="col-span-1 text-muted-foreground">{index + 1}</div>
                    <div className="col-span-5 min-w-0">
                      <div className="truncate font-semibold">
                        {item.target_name ? `${getDisplayName(item)} -> ${item.target_name}` : getDisplayName(item)}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">{item.id || item.source_id || '-'}</div>
                    </div>
                    <div className="col-span-3">
                      <span className="rounded-full border border-border/50 bg-background/70 px-2.5 py-1 text-[11px] font-medium">
                        {getDisplayType(item)}
                      </span>
                    </div>
                    <div className="col-span-3 text-right font-mono text-xs font-semibold text-primary">
                      {getScoreLabel(item)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
