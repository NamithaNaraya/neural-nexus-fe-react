import React from 'react';
import { Calculator, Play, SlidersHorizontal } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent } from '../../../components/ui/Card';
import { Input, Label } from '../../../components/ui/Input';
import { cn } from '../../../utils/cn';
import { ALGORITHM_CATALOG } from '../algorithmCatalog';

export function AlgorithmCatalogPanel({
  selectedAlgorithmId,
  setSelectedAlgorithmId,
  selectedAlgorithm,
  topK,
  setTopK,
  scopeMode,
  selectedNodes,
  currentFolder,
  relationshipProperties,
  weightingEnabled,
  setWeightingEnabled,
  weightFormulaType,
  setWeightFormulaType,
  weightProperty,
  setWeightProperty,
  weightNumerator,
  setWeightNumerator,
  weightDenominator,
  setWeightDenominator,
  weightPrimaryProperty,
  setWeightPrimaryProperty,
  weightSecondaryProperty,
  setWeightSecondaryProperty,
  weightPrimaryCoefficient,
  setWeightPrimaryCoefficient,
  weightSecondaryCoefficient,
  setWeightSecondaryCoefficient,
  running,
  runAlgorithm,
}) {
  return (
    <div className="space-y-4">
      <Card className="border-border/60 bg-card/70 shadow-lg shadow-slate-900/5 backdrop-blur-xl">
        <CardContent className="space-y-4 p-5">
          <div className="space-y-1">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Step 3</div>
            <h2 className="text-lg font-semibold">Algorithms</h2>
            <p className="text-sm text-muted-foreground">Choose the algorithm here. Results will appear on the right.</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {ALGORITHM_CATALOG.map((algorithm) => {
              const Icon = algorithm.icon;
              const active = selectedAlgorithmId === algorithm.id;

              return (
                <button
                  key={algorithm.id}
                  type="button"
                  onClick={() => setSelectedAlgorithmId(algorithm.id)}
                  className={cn(
                    'relative overflow-hidden rounded-2xl border p-4 text-left transition',
                    active
                      ? 'border-primary/30 bg-primary/10 shadow-lg shadow-primary/10'
                      : 'border-border/40 bg-background/35 hover:border-primary/20 hover:bg-background/55'
                  )}
                >
                  <div className={cn('absolute inset-x-0 top-0 h-16 bg-gradient-to-r', algorithm.accent)} />
                  <div className="relative space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className={cn('flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-background/70', algorithm.iconClass)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="rounded-full border border-border/50 bg-background/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {algorithm.category}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{algorithm.name}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{algorithm.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/70 shadow-lg shadow-slate-900/5 backdrop-blur-xl">
        <CardContent className="space-y-4 p-5">
          <div className="space-y-1">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Step 4</div>
            <div className="flex items-center gap-2 text-lg font-semibold">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              Run setup
            </div>
            <p className="text-sm text-muted-foreground">
              {selectedAlgorithm?.name} will run on {scopeMode === 'selection' && selectedNodes.length > 0 ? `${selectedNodes.length} selected node(s)` : currentFolder?.name || 'the current folder scope'}.
            </p>
          </div>

          {selectedAlgorithm?.defaults.top_k !== undefined && (
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Top results</Label>
              <Input
                type="number"
                min="5"
                max="100"
                value={topK}
                onChange={(event) => setTopK(Number(event.target.value) || 10)}
              />
            </div>
          )}

          <div className="space-y-3 rounded-2xl border border-border/40 bg-background/40 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Calculator className="h-4 w-4 text-primary" />
                  Quantitative weighting
                </div>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Use numeric relationship values to influence ranking when the algorithm supports it.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setWeightingEnabled((current) => !current)}
                disabled={!selectedAlgorithm?.usesWeights || relationshipProperties.length === 0}
                className={cn(
                  'relative h-6 w-11 rounded-full transition',
                  weightingEnabled ? 'bg-emerald-500' : 'bg-muted',
                  (!selectedAlgorithm?.usesWeights || relationshipProperties.length === 0) && 'cursor-not-allowed opacity-50'
                )}
              >
                <span className={cn(
                  'absolute top-0.5 h-5 w-5 rounded-full bg-white transition',
                  weightingEnabled ? 'left-[22px]' : 'left-0.5'
                )} />
              </button>
            </div>

            {selectedAlgorithm?.usesWeights ? (
              relationshipProperties.length > 0 ? (
                <>
                  <div className="grid gap-3 md:grid-cols-3">
                    <button
                      type="button"
                      onClick={() => setWeightFormulaType('property')}
                      className={cn('rounded-xl border px-3 py-2 text-xs font-medium transition', weightFormulaType === 'property' ? 'border-primary/30 bg-primary/10' : 'border-border/40 bg-background/60')}
                    >
                      Single property
                    </button>
                    <button
                      type="button"
                      onClick={() => setWeightFormulaType('ratio')}
                      className={cn('rounded-xl border px-3 py-2 text-xs font-medium transition', weightFormulaType === 'ratio' ? 'border-primary/30 bg-primary/10' : 'border-border/40 bg-background/60')}
                    >
                      Ratio
                    </button>
                    <button
                      type="button"
                      onClick={() => setWeightFormulaType('weighted_sum')}
                      className={cn('rounded-xl border px-3 py-2 text-xs font-medium transition', weightFormulaType === 'weighted_sum' ? 'border-primary/30 bg-primary/10' : 'border-border/40 bg-background/60')}
                    >
                      Weighted sum
                    </button>
                  </div>

                  {weightFormulaType === 'property' && (
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Relationship property</Label>
                      <select value={weightProperty} onChange={(event) => setWeightProperty(event.target.value)} className="h-10 w-full rounded-xl border border-border/60 bg-background/70 px-3 text-sm">
                        {relationshipProperties.map((property) => (
                          <option key={property} value={property}>{property}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {weightFormulaType === 'ratio' && (
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Numerator</Label>
                        <select value={weightNumerator} onChange={(event) => setWeightNumerator(event.target.value)} className="h-10 w-full rounded-xl border border-border/60 bg-background/70 px-3 text-sm">
                          {relationshipProperties.map((property) => (
                            <option key={property} value={property}>{property}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Denominator</Label>
                        <select value={weightDenominator} onChange={(event) => setWeightDenominator(event.target.value)} className="h-10 w-full rounded-xl border border-border/60 bg-background/70 px-3 text-sm">
                          {relationshipProperties.map((property) => (
                            <option key={property} value={property}>{property}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {weightFormulaType === 'weighted_sum' && (
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Primary term</Label>
                        <div className="flex gap-2">
                          <Input type="number" step="0.1" value={weightPrimaryCoefficient} onChange={(event) => setWeightPrimaryCoefficient(Number(event.target.value) || 0)} />
                          <select value={weightPrimaryProperty} onChange={(event) => setWeightPrimaryProperty(event.target.value)} className="h-10 w-full rounded-xl border border-border/60 bg-background/70 px-3 text-sm">
                            {relationshipProperties.map((property) => (
                              <option key={property} value={property}>{property}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Secondary term</Label>
                        <div className="flex gap-2">
                          <Input type="number" step="0.1" value={weightSecondaryCoefficient} onChange={(event) => setWeightSecondaryCoefficient(Number(event.target.value) || 0)} />
                          <select value={weightSecondaryProperty} onChange={(event) => setWeightSecondaryProperty(event.target.value)} className="h-10 w-full rounded-xl border border-border/60 bg-background/70 px-3 text-sm">
                            {relationshipProperties.map((property) => (
                              <option key={property} value={property}>{property}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No numeric relationship fields were found in this folder, so quantitative weighting is unavailable here.
                </p>
              )
            ) : (
              <p className="text-xs text-muted-foreground">
                This algorithm is structural only, so quantitative weighting does not apply.
              </p>
            )}
          </div>

          <Button variant="gradient" className="w-full gap-2" onClick={runAlgorithm} disabled={running}>
            <Play className={cn('h-4 w-4', running && 'animate-pulse')} />
            {running ? 'Running algorithm...' : `Run ${selectedAlgorithm?.name || 'Algorithm'}`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
