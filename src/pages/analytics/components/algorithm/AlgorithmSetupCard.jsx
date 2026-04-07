import React from 'react';
import { Calculator, Play } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { Card, CardContent } from '../../../../components/ui/Card';
import { Input, Label } from '../../../../components/ui/Input';
import { cn } from '../../../../utils/cn';

function NodeSelectField({ label, value, nodes, onChange }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</Label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-xl border border-border/60 bg-background/70 px-3 text-sm"
      >
        <option value="">Choose a node</option>
        {nodes.map((node) => (
          <option key={node.id} value={node.id}>
            {node.name || node.id} {node.type ? `(${node.type})` : ''}
          </option>
        ))}
      </select>
    </div>
  );
}

export function AlgorithmSetupCard({
  collapsed,
  selectedAlgorithm,
  folderNodes,
  graphStats,
  algorithmParams,
  setAlgorithmParam,
  runFullFolder,
  selectedNodes,
  running,
  runAlgorithm,
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
}) {
  const Icon = selectedAlgorithm?.icon;
  return (
    <Card className="border-border/60 bg-card/70 shadow-lg shadow-slate-900/5 backdrop-blur-xl">
      <CardContent className="space-y-2.5 p-3">
        <div className="space-y-0.5">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Step 1</div>
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 gap-3">
              {Icon && (
                <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-background/80', selectedAlgorithm?.chipClass)}>
                  <Icon className={cn('h-4.5 w-4.5', selectedAlgorithm?.iconClass)} />
                </div>
              )}
              <div className="min-w-0">
                <h2 className="text-sm font-semibold">{selectedAlgorithm?.name}</h2>
                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{selectedAlgorithm?.description}</p>
              </div>
            </div>
            <span className={cn('shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]', selectedAlgorithm?.chipClass || 'border-border/50 bg-background/60 text-muted-foreground')}>
              {selectedAlgorithm?.group}
            </span>
          </div>
        </div>

        {collapsed ? (
          <div className="rounded-xl border border-border/40 bg-background/35 px-3 py-2 text-xs text-muted-foreground">
            {runFullFolder
              ? `${graphStats.nodes.toLocaleString()} nodes from the full folder.`
              : `${selectedNodes.length} selected node${selectedNodes.length === 1 ? '' : 's'}.`}
          </div>
        ) : (
          <>
        <div className={cn('rounded-xl border border-border/40 bg-background/40 p-3', selectedAlgorithm?.accent && `bg-gradient-to-r ${selectedAlgorithm.accent}`)}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Ready to run</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {runFullFolder
                  ? `${graphStats.nodes.toLocaleString()} nodes from the full folder.`
                  : `${selectedNodes.length} selected node${selectedNodes.length === 1 ? '' : 's'}.`}
              </p>
            </div>
            <Button variant="gradient" className="gap-2" onClick={runAlgorithm} disabled={running}>
              <Play className={cn('h-4 w-4', running && 'animate-pulse')} />
              {running ? 'Running...' : 'Run'}
            </Button>
          </div>
        </div>

        {(selectedAlgorithm?.params || []).filter((param) => param.type !== 'hidden').length > 0 && (
          <div className="grid gap-3 md:grid-cols-2">
            {selectedAlgorithm.params.filter((param) => param.type !== 'hidden').map((param) => {
              if (param.type === 'node-select') {
                return (
                  <NodeSelectField
                    key={param.key}
                    label={param.label}
                    value={algorithmParams[param.key] || ''}
                    nodes={folderNodes}
                    onChange={(value) => setAlgorithmParam(param.key, value)}
                  />
                );
              }

              return (
                <div key={param.key} className="space-y-2">
                  <Label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{param.label}</Label>
                  <Input
                    type="number"
                    min={param.min}
                    max={param.max}
                    value={algorithmParams[param.key] ?? ''}
                    onChange={(event) => setAlgorithmParam(param.key, Number(event.target.value) || param.defaultValue || 0)}
                  />
                </div>
              );
            })}
          </div>
        )}

        <div className="space-y-2 rounded-xl border border-border/40 bg-background/35 p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Calculator className="h-4 w-4 text-primary" />
                Quantitative weighting
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">Optional.</p>
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
                <div className="grid gap-2 md:grid-cols-3">
                  {['property', 'ratio', 'weighted_sum'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setWeightFormulaType(type)}
                      className={cn(
                        'rounded-xl border px-3 py-2 text-xs font-medium transition',
                        weightFormulaType === type ? 'border-primary/30 bg-primary/10' : 'border-border/40 bg-background/60'
                      )}
                    >
                      {type === 'property' ? 'Single property' : type === 'ratio' ? 'Ratio' : 'Weighted sum'}
                    </button>
                  ))}
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
              <p className="text-xs text-muted-foreground">No numeric relationship fields were found in this folder.</p>
            )
          ) : (
            <p className="text-xs text-muted-foreground">This algorithm uses structure only, so weighting does not apply.</p>
          )}
        </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
