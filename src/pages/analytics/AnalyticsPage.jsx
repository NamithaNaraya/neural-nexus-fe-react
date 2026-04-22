import React, { useEffect, useState } from 'react';
import { AlgorithmSidebar } from './components/algorithm/AlgorithmSidebar';
import { AlgorithmSetupCard } from './components/algorithm/AlgorithmSetupCard';
import { DataScopeCard } from './components/data/DataScopeCard';
import { AnalyticsResultsPanel } from './components/AnalyticsResultsPanel';
import { describeWeightFormula, formatAlgorithmSummary } from './helpers';
import { useAnalyticsWorkbench } from './useAnalyticsWorkbench';
import { Sprout, BrainCircuit, Activity } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { cn } from '../../utils/cn';

export default function AnalyticsPage() {
  const [topPanelsCollapsed, setTopPanelsCollapsed] = useState(false);
  const {
    folderId,
    currentFolder,
    folderNodes,
    folderLinks,
    nodeTypes,
    relationshipTypes,
    graphStats,
    selectedNodes,
    toggleNode,
    clearSelection,
    selectedAlgorithm,
    selectedAlgorithmId,
    setSelectedAlgorithmId,
    algorithmParams,
    setAlgorithmParam,
    running,
    result,
    error,
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
    weightFormula,
    runFullFolder,
    setRunFullFolder,
  } = useAnalyticsWorkbench();

  useEffect(() => {
    if (result) {
      setTopPanelsCollapsed(true);
    }
  }, [result]);

  return (
    <section aria-labelledby="analytics-page-title" className="flex h-full min-h-0 flex-col gap-8 overflow-hidden pt-4 bg-transparent">
      {/* Botanical Header */}
      <div className="flex flex-col gap-4 px-2">
        <div className="flex items-center gap-3">
           <div className="p-2.5 rounded-2xl bg-accent/10 backdrop-blur-xl border border-accent/20">
             <BrainCircuit className="h-6 w-6 text-accent animate-pulse" />
           </div>
           <Badge variant="secondary" className="px-5 py-2 text-[10px] bg-accent/5 text-accent border border-accent/20 uppercase tracking-[0.3em] font-black rounded-xl">
             Neural Analytics
           </Badge>
        </div>
        <div className="space-y-2">
          <h1 id="analytics-page-title" className="text-4xl font-black tracking-tighter text-foreground uppercase">Workbench</h1>
          <p className="max-w-3xl text-[14px] text-muted-foreground/60 font-bold leading-relaxed tracking-tight group-hover:text-muted-foreground/80 transition-colors">
            Analyze the complexity of your knowledge network. Use high-performance algorithmic synthesis to uncover structural patterns and neural clusters within your synthesized data.
          </p>
        </div>
      </div>

      <div className="grid flex-1 min-h-0 gap-6 xl:grid-cols-[340px_minmax(0,1fr)] px-2 pb-6">
        {/* Sidebar Panel */}
        <div className="min-h-0 h-full overflow-hidden animate-in fade-in slide-in-from-left-8 duration-700">
          <AlgorithmSidebar
            selectedAlgorithmId={selectedAlgorithmId}
            setSelectedAlgorithmId={setSelectedAlgorithmId}
          />
        </div>

        {/* Main Workbench Area */}
        <div className="grid min-h-0 gap-6 lg:grid-rows-[auto_1fr] animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className={cn(
            "grid gap-6 transition-all duration-700",
            topPanelsCollapsed ? "xl:grid-cols-1" : "xl:grid-cols-[1fr_1.1fr]"
          )}>
            <AlgorithmSetupCard
              collapsed={topPanelsCollapsed}
              selectedAlgorithm={selectedAlgorithm}
              folderNodes={folderNodes}
              graphStats={graphStats}
              algorithmParams={algorithmParams}
              setAlgorithmParam={setAlgorithmParam}
              runFullFolder={runFullFolder}
              selectedNodes={selectedNodes}
              running={running}
              runAlgorithm={runAlgorithm}
              relationshipProperties={relationshipProperties}
              weightingEnabled={weightingEnabled}
              setWeightingEnabled={setWeightingEnabled}
              weightFormulaType={weightFormulaType}
              setWeightFormulaType={setWeightFormulaType}
              weightProperty={weightProperty}
              setWeightProperty={setWeightProperty}
              weightNumerator={weightNumerator}
              setWeightNumerator={setWeightNumerator}
              weightDenominator={weightDenominator}
              setWeightDenominator={setWeightDenominator}
              weightPrimaryProperty={weightPrimaryProperty}
              setWeightPrimaryProperty={setWeightPrimaryProperty}
              weightSecondaryProperty={weightSecondaryProperty}
              setWeightSecondaryProperty={setWeightSecondaryProperty}
              weightPrimaryCoefficient={weightPrimaryCoefficient}
              setWeightPrimaryCoefficient={setWeightPrimaryCoefficient}
              weightSecondaryCoefficient={weightSecondaryCoefficient}
              setWeightSecondaryCoefficient={setWeightSecondaryCoefficient}
            />

            <DataScopeCard
              collapsed={topPanelsCollapsed}
              onToggleCollapsed={() => setTopPanelsCollapsed((current) => !current)}
              currentFolder={currentFolder}
              graphStats={graphStats}
              nodeTypes={nodeTypes}
              relationshipTypes={relationshipTypes}
              folderNodes={folderNodes}
              folderLinks={folderLinks}
              runFullFolder={runFullFolder}
              setRunFullFolder={setRunFullFolder}
              selectedNodes={selectedNodes}
              toggleNode={toggleNode}
              clearSelection={clearSelection}
            />
          </div>

          <div className="min-h-0 h-full overflow-hidden" aria-live="polite">
            <AnalyticsResultsPanel
              result={result}
              error={error}
              summary={`${formatAlgorithmSummary(
                result,
                selectedAlgorithm,
                runFullFolder ? 0 : selectedNodes.length,
                currentFolder?.name
              )} ${weightingEnabled && weightFormula ? describeWeightFormula(weightFormula) : ''}`.trim()}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
