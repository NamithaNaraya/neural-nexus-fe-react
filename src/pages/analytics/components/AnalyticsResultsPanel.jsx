import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/Card';
import { getCompactTypeLabel, getDisplayName, getScoreLabel, getTypeToneClasses } from '../helpers';

export function AnalyticsResultsPanel({ result, summary, error }) {
  const [visibleCount, setVisibleCount] = useState(25);
  const scrollContainerRef = useRef(null);

  const rows = useMemo(() => result?.results || [], [result]);

  useEffect(() => {
    setVisibleCount(25);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [result]);

  const visibleRows = rows.slice(0, visibleCount);

  function handleScroll(event) {
    const element = event.currentTarget;
    const nearBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 120;

    if (nearBottom && visibleCount < rows.length) {
      setVisibleCount((count) => Math.min(count + 25, rows.length));
    }
  }

  return (
    <Card className="flex h-full min-h-0 flex-col border-border/60 bg-card/70 shadow-lg shadow-slate-900/5 backdrop-blur-xl">
      <CardContent className="flex min-h-0 flex-1 flex-col space-y-4 p-4">
        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Results</div>
          <h2 className="text-lg font-semibold">Output</h2>
        </div>

        {error && (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
            {error}
          </div>
        )}

        {!result && !error && (
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-border/40 bg-background/30 px-4 py-12 text-center">
            <div>
            <Sparkles className="mx-auto h-10 w-10 text-primary/60" />
            <p className="mt-4 text-sm font-semibold">No algorithm run yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Choose the folder and algorithm on the left, then click the run button.</p>
            </div>
          </div>
        )}

        {result && (
          <div className="flex min-h-0 flex-1 flex-col space-y-4">
            <div className="rounded-2xl border border-primary/20 bg-primary/10 p-3">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-background/80 text-primary">
                  <CheckCircle2 className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Analysis summary</p>
                  <p className="mt-1.5 text-sm leading-6 text-foreground">{summary}</p>
                </div>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-border/40 bg-background/30">
              <div className="grid grid-cols-12 gap-2 border-b border-border/40 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <div className="col-span-1">#</div>
                <div className="col-span-5">Name</div>
                <div className="col-span-3">Type</div>
                <div className="col-span-3 text-right">Score</div>
              </div>

              <div ref={scrollContainerRef} className="min-h-0 flex-1 overflow-y-auto" onScroll={handleScroll}>
                {visibleRows.map((item, index) => (
                  <div key={item.id || `${index}-${getDisplayName(item)}`} className="grid grid-cols-12 gap-2 border-t border-border/30 px-4 py-3 text-sm">
                    <div className="col-span-1 text-muted-foreground">{index + 1}</div>
                    <div className="col-span-5 min-w-0">
                      <div className="truncate font-semibold">
                        {item.target_name ? `${getDisplayName(item)} -> ${item.target_name}` : getDisplayName(item)}
                      </div>
                    </div>
                    <div className="col-span-3">
                      <span
                        className={`inline-flex max-w-full truncate rounded-full border px-2.5 py-1 text-[11px] font-medium ${getTypeToneClasses(item)}`}
                        title={getCompactTypeLabel(item)}
                      >
                        {getCompactTypeLabel(item)}
                      </span>
                    </div>
                    <div className="col-span-3 text-right font-mono text-xs font-semibold text-primary">
                      {getScoreLabel(item)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
