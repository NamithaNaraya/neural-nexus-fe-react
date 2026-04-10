import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, ShieldAlert, Sparkles } from 'lucide-react';
import { analyticsService } from '../../../services/analyticsService';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent } from '../../../components/ui/Card';

function statusTone(status) {
  switch ((status || '').toLowerCase()) {
    case 'healthy':
      return 'text-emerald-600 dark:text-emerald-300';
    case 'critical':
      return 'text-red-600 dark:text-red-300';
    default:
      return 'text-primary dark:text-primary';
  }
}

function pickCount(value, fallbackKeys = []) {
  if (typeof value === 'number') return value;
  for (const key of fallbackKeys) {
    const candidate = value?.[key];
    if (typeof candidate === 'number') return candidate;
  }
  return 0;
}

export function GraphDataQualityPanel({ folderId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [health, setHealth] = useState(null);
  const [incomplete, setIncomplete] = useState(null);
  const [missing, setMissing] = useState(null);

  const hasResults = Boolean(health || incomplete || missing);

  const summary = useMemo(() => ({
    incompleteCount: pickCount(incomplete, ['incomplete_count']),
    missingCount: pickCount(missing, ['found_count']),
    recommendations: Array.isArray(health?.recommendations) ? health.recommendations.slice(0, 3) : [],
  }), [health, incomplete, missing]);

  const runAnalysis = async () => {
    if (!folderId) return;
    setLoading(true);
    setError('');
    try {
      const [healthData, incompleteData, missingData] = await Promise.all([
        analyticsService.runAlgorithm('/analytics/graph-health', { folder_id: folderId }),
        analyticsService.runAlgorithm('/analytics/incomplete-entities', { folder_id: folderId }),
        analyticsService.runAlgorithm('/analytics/missing-relationships', { folder_id: folderId }),
      ]);
      setHealth(healthData || null);
      setIncomplete(incompleteData || null);
      setMissing(missingData || null);
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'Quality analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Data quality</div>
          <p className="mt-1 text-xs text-muted-foreground">Runs lazily only when you ask for it.</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 rounded-full" onClick={runAnalysis} disabled={!folderId || loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {hasResults ? 'Refresh' : 'Analyze'}
        </Button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-600">
          {error}
        </div>
      ) : null}

      {!hasResults && !loading ? (
        <Card className="border-dashed border-border/50 bg-background/40">
          <CardContent className="space-y-2 p-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 text-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              Quality snapshot
            </div>
            <p className="text-xs">Check graph health, incomplete entities, and missing relationships for the selected folder.</p>
          </CardContent>
        </Card>
      ) : null}

      {hasResults ? (
        <div className="grid gap-3">
          <Card className="border-border/50 bg-card/70">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">Graph health</span>
                </div>
                <span className={`text-xs font-semibold uppercase tracking-[0.18em] ${statusTone(health?.status)}`}>
                  {health?.status || 'Unknown'}
                </span>
              </div>
              <div className="text-2xl font-bold">
                {typeof health?.overall_score === 'number' ? `${Math.round(health.overall_score * 100)}%` : '—'}
              </div>
              <p className="text-xs text-muted-foreground">{health?.insight || 'Health insight will appear here.'}</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Card className="border-border/50 bg-card/70">
              <CardContent className="space-y-2 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <AlertTriangle className="h-4 w-4 text-primary" />
                  Incomplete
                </div>
                <div className="text-xl font-bold">{summary.incompleteCount}</div>
                <p className="text-xs text-muted-foreground">{incomplete?.insight || 'Missing-property checks available here.'}</p>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/70">
              <CardContent className="space-y-2 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Missing links
                </div>
                <div className="text-xl font-bold">{summary.missingCount}</div>
                <p className="text-xs text-muted-foreground">{missing?.insight || 'Potential relationship gaps show here.'}</p>
              </CardContent>
            </Card>
          </div>

          {summary.recommendations.length ? (
            <Card className="border-border/50 bg-card/70">
              <CardContent className="space-y-2 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Recommendations</div>
                <div className="space-y-2">
                  {summary.recommendations.map((recommendation) => (
                    <div key={recommendation} className="rounded-xl border border-border/40 bg-background/50 px-3 py-2 text-xs text-muted-foreground">
                      {recommendation}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
