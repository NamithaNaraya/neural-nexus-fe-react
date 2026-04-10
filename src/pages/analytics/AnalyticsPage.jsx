import React, { useEffect, useState } from 'react';
import { AlgorithmSidebar } from './components/algorithm/AlgorithmSidebar';
import { AlgorithmSetupCard } from './components/algorithm/AlgorithmSetupCard';
import { DataScopeCard } from './components/data/DataScopeCard';
import { AnalyticsResultsPanel } from './components/AnalyticsResultsPanel';
import { describeWeightFormula, formatAlgorithmSummary } from './helpers';
import { useAnalyticsWorkbench } from './useAnalyticsWorkbench';

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
    <section aria-labelledby="analytics-page-title" className="h-[calc(100vh-8.5rem)] min-h-[640px] overflow-hidden">
      <h1 id="analytics-page-title" className="sr-only">Analytics workbench</h1>
      <div className="grid h-full gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="min-h-0">
          <AlgorithmSidebar
            selectedAlgorithmId={selectedAlgorithmId}
            setSelectedAlgorithmId={setSelectedAlgorithmId}
          />
        </div>

        <div className="grid min-h-0 gap-4 lg:grid-rows-[auto_1fr]">
          <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
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

          <div className="min-h-0" aria-live="polite">
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
