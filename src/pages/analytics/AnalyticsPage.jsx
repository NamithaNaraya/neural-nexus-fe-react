import React from 'react';
import { AnalyticsHero } from './components/AnalyticsHero';
import { AnalyticsResultsPanel } from './components/AnalyticsResultsPanel';
import { AnalyticsScopePanel } from './components/AnalyticsScopePanel';
import { AlgorithmCatalogPanel } from './components/AlgorithmCatalogPanel';
import { describeWeightFormula, formatAlgorithmSummary } from './helpers';
import { useAnalyticsWorkbench } from './useAnalyticsWorkbench';

export default function AnalyticsPage() {
  const {
    folders,
    folderId,
    setFolderId,
    currentFolder,
    graphStats,
    filteredNodes,
    nodeSearch,
    setNodeSearch,
    scopeMode,
    setScopeMode,
    selectedNodes,
    toggleNode,
    clearSelection,
    selectedAlgorithm,
    selectedAlgorithmId,
    setSelectedAlgorithmId,
    topK,
    setTopK,
    loadingNodes,
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
    running,
    result,
    error,
    runAlgorithm,
  } = useAnalyticsWorkbench();

  return (
    <div className="space-y-6 pb-6">
      <AnalyticsHero />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <AnalyticsScopePanel
            folders={folders}
            folderId={folderId}
            setFolderId={setFolderId}
            currentFolder={currentFolder}
            graphStats={graphStats}
            loadingNodes={loadingNodes}
            scopeMode={scopeMode}
            setScopeMode={setScopeMode}
            selectedNodes={selectedNodes}
            clearSelection={clearSelection}
            nodeSearch={nodeSearch}
            setNodeSearch={setNodeSearch}
            filteredNodes={filteredNodes}
            toggleNode={toggleNode}
          />

          <AlgorithmCatalogPanel
            selectedAlgorithmId={selectedAlgorithmId}
            setSelectedAlgorithmId={setSelectedAlgorithmId}
            selectedAlgorithm={selectedAlgorithm}
            topK={topK}
            setTopK={setTopK}
            scopeMode={scopeMode}
            selectedNodes={selectedNodes}
            currentFolder={currentFolder}
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
            running={running}
            runAlgorithm={runAlgorithm}
          />
        </div>

        <AnalyticsResultsPanel
          result={result}
          error={error}
          summary={`${formatAlgorithmSummary(result, selectedAlgorithm, scopeMode === 'selection' ? selectedNodes.length : 0, currentFolder?.name)} ${weightingEnabled && weightFormula ? describeWeightFormula(weightFormula) : ''}`.trim()}
        />
      </div>
    </div>
  );
}
