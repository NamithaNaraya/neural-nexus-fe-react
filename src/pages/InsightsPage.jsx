import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  BrainCircuit,
  CheckCircle2,
  Fingerprint,
  GitCompareArrows,
  Link2,
  Loader2,
  Tags,
  Trash2,
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Label } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { useGlobalFolder } from '../contexts/GlobalFolderContext';
import mlService from '../services/mlService';

const TASKS = [
  { id: 'catalog', label: 'Catalog', icon: BrainCircuit, tone: 'slate' },
  { id: 'linkPrediction', label: 'Link Prediction', icon: Link2, tone: 'pink' },
  { id: 'nodeClassification', label: 'Node Classification', icon: Tags, tone: 'purple' },
  { id: 'embeddings', label: 'Embeddings', icon: Fingerprint, tone: 'amber' },
  { id: 'similarity', label: 'Similarity', icon: GitCompareArrows, tone: 'teal' },
];

const initialState = {
  models: [],
  trainResult: null,
  linkPredictions: [],
  nodePredictions: [],
  embeddingResult: null,
  similarityResult: null,
  statusMsg: '',
  errorMsg: '',
};

function MLField({ label, children }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export default function MLPredictionPage() {
  const { selectedFolderId } = useGlobalFolder();
  const [activeTask, setActiveTask] = useState('catalog');
  const [isLoading, setIsLoading] = useState(false);
  const [state, setState] = useState(initialState);
  const [lpPipeline, setLpPipeline] = useState('my_lp_pipeline');
  const [lpModel, setLpModel] = useState('my_lp_model');
  const [lpThreshold, setLpThreshold] = useState(0.5);
  const [lpTopN, setLpTopN] = useState(50);
  const [ncPipeline, setNcPipeline] = useState('my_nc_pipeline');
  const [ncModel, setNcModel] = useState('my_nc_model');
  const [embMethod, setEmbMethod] = useState('fastRP');
  const [embDim, setEmbDim] = useState(128);
  const [similarityTopK, setSimilarityTopK] = useState(10);
  const [similarityCutoff, setSimilarityCutoff] = useState(0.1);

  const refreshCatalog = async () => {
    try {
      const data = await mlService.getModels();
      setState((prev) => ({
        ...prev,
        models: Array.isArray(data?.models) ? data.models : [],
      }));
    } catch (error) {
      console.error('Failed to load ML models:', error);
    }
  };

  useEffect(() => {
    void refreshCatalog();
  }, []);

  const updateState = (patch) => {
    setState((prev) => ({ ...prev, ...patch }));
  };

  const clearMessages = () => {
    updateState({
      trainResult: null,
      linkPredictions: [],
      nodePredictions: [],
      embeddingResult: null,
      similarityResult: null,
      statusMsg: '',
      errorMsg: '',
    });
  };

  const requireFolder = () => {
    if (!selectedFolderId) {
      updateState({ errorMsg: 'Open a folder first to run ML actions.' });
      return false;
    }
    return true;
  };

  const trainLinkPrediction = async () => {
    if (!requireFolder()) return;
    const pipeline = lpPipeline.trim();
    const model = lpModel.trim();
    if (!pipeline || !model) {
      updateState({ errorMsg: 'Pipeline name and model name are required.' });
      return;
    }

    setIsLoading(true);
    clearMessages();
    updateState({
      statusMsg: 'Training link prediction pipeline and generating model...',
    });

    try {
      const result = await mlService.trainLinkPrediction(selectedFolderId, pipeline, model);
      updateState({ trainResult: result, statusMsg: '' });
      await refreshCatalog();
      setActiveTask('catalog');
    } catch (error) {
      updateState({
        errorMsg: error?.response?.data?.detail || error?.message || 'Training failed.',
        statusMsg: '',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const trainNodeClassification = async () => {
    const pipeline = ncPipeline.trim();
    const model = ncModel.trim();
    if (!pipeline || !model) {
      updateState({ errorMsg: 'Pipeline name and model name are required.' });
      return;
    }

    setIsLoading(true);
    clearMessages();
    updateState({
      statusMsg: 'Encoding node types, training classifier, and saving the model...',
    });

    try {
      const result = await mlService.trainNodeClassification(pipeline, model);
      updateState({ trainResult: result, statusMsg: '' });
      await refreshCatalog();
      setActiveTask('catalog');
    } catch (error) {
      updateState({
        errorMsg: error?.response?.data?.detail || error?.message || 'Training failed.',
        statusMsg: '',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const predictLinks = async (modelName) => {
    if (!requireFolder()) return;
    setIsLoading(true);
    updateState({ errorMsg: '', statusMsg: 'Running link prediction on the current folder...' });
    try {
      const result = await mlService.predictLinks(selectedFolderId, modelName, lpThreshold, lpTopN);
      updateState({
        linkPredictions: Array.isArray(result?.predictions) ? result.predictions : [],
        statusMsg: '',
      });
      setActiveTask('linkPrediction');
    } catch (error) {
      updateState({
        errorMsg: error?.response?.data?.detail || error?.message || 'Prediction failed.',
        statusMsg: '',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const predictNodeClasses = async (modelName) => {
    setIsLoading(true);
    updateState({ errorMsg: '', statusMsg: 'Running node classification predictions...' });
    try {
      const result = await mlService.predictNodeClasses(modelName, 100);
      updateState({
        nodePredictions: Array.isArray(result?.predictions) ? result.predictions : [],
        statusMsg: '',
      });
      setActiveTask('nodeClassification');
    } catch (error) {
      updateState({
        errorMsg: error?.response?.data?.detail || error?.message || 'Prediction failed.',
        statusMsg: '',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateEmbeddings = async () => {
    if (!requireFolder()) return;
    setIsLoading(true);
    clearMessages();
    updateState({ statusMsg: `Generating ${embMethod} embeddings...` });
    try {
      const result = await mlService.generateEmbeddings(selectedFolderId, embMethod, embDim);
      updateState({ embeddingResult: result, statusMsg: '' });
      setActiveTask('embeddings');
    } catch (error) {
      updateState({
        errorMsg: error?.response?.data?.detail || error?.message || 'Embedding generation failed.',
        statusMsg: '',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runSimilarity = async () => {
    if (!requireFolder()) return;
    setIsLoading(true);
    clearMessages();
    updateState({ statusMsg: 'Computing node similarity across the current folder...' });
    try {
      const result = await mlService.nodeSimilarity(selectedFolderId, similarityTopK, similarityCutoff);
      updateState({ similarityResult: result, statusMsg: '' });
      setActiveTask('similarity');
    } catch (error) {
      updateState({
        errorMsg: error?.response?.data?.detail || error?.message || 'Similarity check failed.',
        statusMsg: '',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteModel = async (modelName) => {
    if (!window.confirm(`Delete model "${modelName}"?`)) return;
    setIsLoading(true);
    updateState({ errorMsg: '', statusMsg: '' });
    try {
      await mlService.dropModel(modelName);
      await refreshCatalog();
    } catch (error) {
      updateState({
        errorMsg: error?.response?.data?.detail || error?.message || 'Could not delete the model.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const activeTaskMeta = TASKS.find((task) => task.id === activeTask) || TASKS[0];
  const ActiveIcon = activeTaskMeta.icon;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden animate-fade-up">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
          <span className="gradient-text">ML Prediction</span>
        </h1>
        <p className="text-muted-foreground text-sm">
          Simple ML tools that help the graph find hidden links, mislabeled nodes, and similar patterns.
        </p>
      </div>

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden border-border/50 shadow-lg shadow-slate-900/5">
        <div className="border-b border-border/40 bg-card/40 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            {TASKS.map((task) => {
              const Icon = task.icon;
              const active = task.id === activeTask;
              return (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => {
                    setActiveTask(task.id);
                    updateState({ errorMsg: '', statusMsg: '' });
                  }}
                  className={[
                    'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'border-primary/30 bg-primary/10 text-primary'
                      : 'border-border/50 bg-background/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                  ].join(' ')}
                >
                  <Icon className="h-4 w-4" />
                  {task.label}
                </button>
              );
            })}
          </div>
        </div>

        <CardContent className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4 pt-4 lg:p-5 lg:pt-5">
          {activeTask === 'catalog' && (
            <div className="flex min-h-0 flex-1 flex-col space-y-4">
              {state.models.length === 0 ? (
                <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 py-10 text-center">
                  <BrainCircuit className="mx-auto h-10 w-10 text-muted-foreground/40" />
                  <p className="mt-3 text-sm font-medium text-foreground">No models yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">Train one from the tabs below and it will appear here.</p>
                </div>
              ) : (
                <div className="grid min-h-0 gap-3 overflow-y-auto pr-1 lg:grid-cols-2">
                  {state.models.map((model, index) => {
                    const modelType = String(model?.modelType || model?.type || '');
                    const modelName = model?.modelName || model?.name || `Model ${index + 1}`;
                    const isLinkModel = modelType.toLowerCase().includes('link');
                    const isClassModel = modelType.toLowerCase().includes('classification');

                    return (
                      <div key={`${modelName}-${index}`} className="rounded-2xl border border-border/50 bg-background/40 p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate text-base font-semibold">{modelName}</h3>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Type:{' '}
                              <span className={isLinkModel ? 'text-pink-500' : isClassModel ? 'text-purple-500' : 'text-foreground'}>
                                {modelType || 'Unknown'}
                              </span>
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => deleteModel(modelName)}
                            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                            title="Delete model"
                            disabled={isLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="mt-4 flex gap-2">
                          {isLinkModel && (
                            <Button
                              type="button"
                              variant="outline"
                              className="flex-1 border-pink-500/30 text-pink-500 hover:bg-pink-500/10"
                              onClick={() => predictLinks(modelName)}
                              disabled={isLoading}
                            >
                              Predict Links
                            </Button>
                          )}
                          {isClassModel && (
                            <Button
                              type="button"
                              variant="outline"
                              className="flex-1 border-purple-500/30 text-purple-500 hover:bg-purple-500/10"
                              onClick={() => predictNodeClasses(modelName)}
                              disabled={isLoading}
                            >
                              Classify Nodes
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTask === 'linkPrediction' && (
            <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.84fr)]">
              <div className="space-y-3">
              <div className="rounded-2xl border border-pink-500/20 bg-pink-500/5 px-4 py-3 text-sm text-pink-700 dark:text-pink-300">
                  Finds likely missing links between nodes. In simple terms: it spots pairs that look connected but are not yet joined.
                </div>

                <MLField label="Pipeline Name">
                  <Input value={lpPipeline} onChange={(e) => setLpPipeline(e.target.value)} disabled={isLoading} className="h-10" />
                </MLField>
                <MLField label="Model Name">
                  <Input value={lpModel} onChange={(e) => setLpModel(e.target.value)} disabled={isLoading} className="h-10" />
                </MLField>
                <div className="grid grid-cols-2 gap-3">
                  <MLField label="Threshold">
                    <Input
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      value={lpThreshold}
                      onChange={(e) => setLpThreshold(Number(e.target.value))}
                      disabled={isLoading}
                      className="h-10"
                    />
                  </MLField>
                  <MLField label="Top N">
                    <Input
                      type="number"
                      min="1"
                      max="200"
                      value={lpTopN}
                      onChange={(e) => setLpTopN(Number(e.target.value))}
                      disabled={isLoading}
                      className="h-10"
                    />
                  </MLField>
                </div>

                <Button variant="gradient" className="h-10 w-full" onClick={trainLinkPrediction} disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Train Link Prediction
                </Button>
              </div>

              <div className="flex min-h-0 flex-col space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <ActiveIcon className="h-4 w-4 text-pink-500" />
                  What it found
                </div>
                {state.linkPredictions.length === 0 ? (
                  <div className="flex min-h-0 flex-1 items-center rounded-2xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
                    Run a model from the catalog to view predicted links here.
                  </div>
                ) : (
                  <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                    {state.linkPredictions.slice(0, 12).map((item, index) => (
                      <div key={index} className="rounded-xl border border-border/50 bg-background/40 px-3 py-2.5 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0 font-medium">
                            <span className="truncate">{item.source_name || item.source_id || 'Source'}</span>
                            <span className="mx-2 text-muted-foreground">→</span>
                            <span className="truncate">{item.target_name || item.target_id || 'Target'}</span>
                          </div>
                          <Badge variant="info">
                            {typeof item.probability === 'number' ? `${(item.probability * 100).toFixed(1)}%` : 'Predicted'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTask === 'nodeClassification' && (
            <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.84fr)]">
              <div className="space-y-3">
              <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 px-4 py-3 text-sm text-purple-700 dark:text-purple-300">
                  Checks whether a node looks like the wrong type. Useful when data was labeled by hand and needs a quick sanity check.
                </div>

                <MLField label="Pipeline Name">
                  <Input value={ncPipeline} onChange={(e) => setNcPipeline(e.target.value)} disabled={isLoading} className="h-10" />
                </MLField>
                <MLField label="Model Name">
                  <Input value={ncModel} onChange={(e) => setNcModel(e.target.value)} disabled={isLoading} className="h-10" />
                </MLField>

                <Button variant="gradient" className="h-10 w-full" onClick={trainNodeClassification} disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Train Node Classifier
                </Button>
              </div>

              <div className="flex min-h-0 flex-col space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <ActiveIcon className="h-4 w-4 text-purple-500" />
                  What it found
                </div>
                {state.nodePredictions.length === 0 ? (
                  <div className="flex min-h-0 flex-1 items-center rounded-2xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
                    Run a node classification model from the catalog to view predictions here.
                  </div>
                ) : (
                  <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                    {state.nodePredictions.slice(0, 16).map((item, index) => {
                      const matches = item.current_type === item.predicted_type;
                      return (
                        <div
                          key={index}
                          className={[
                            'rounded-xl border p-3 text-sm',
                            matches
                              ? 'border-border/50 bg-background/40'
                              : 'border-amber-500/20 bg-amber-500/5',
                          ].join(' ')}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="min-w-0 truncate font-medium">{item.name || 'Unnamed node'}</span>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-muted-foreground">{item.current_type || 'Unknown'}</span>
                              <span>→</span>
                              <span className={matches ? 'text-emerald-500' : 'text-amber-500'}>
                                {item.predicted_type || 'Unknown'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTask === 'embeddings' && (
            <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.84fr)]">
              <div className="space-y-3">
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
                  Creates a compact numeric fingerprint for each node so the app can compare them more easily.
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {['fastRP', 'node2vec'].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setEmbMethod(method)}
                      className={[
                        'rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors',
                        embMethod === method
                          ? 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-300'
                          : 'border-border/50 bg-background/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                      ].join(' ')}
                    >
                      {method === 'fastRP' ? 'FastRP' : 'Node2Vec'}
                    </button>
                  ))}
                </div>

                <MLField label={`Dimensions: ${embDim}`}>
                  <input
                    type="range"
                    min="16"
                    max="512"
                    step="16"
                    value={embDim}
                    onChange={(e) => setEmbDim(Number(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </MLField>

                <Button variant="gradient" className="h-10 w-full" onClick={generateEmbeddings} disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Generate Embeddings
                </Button>
              </div>

              <div className="flex min-h-0 flex-col space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Fingerprint className="h-4 w-4 text-amber-500" />
                  Fingerprints
                </div>
                {state.embeddingResult ? (
                  <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-border/50 bg-background/40 p-4">
                    <p className="text-sm font-medium">
                      {state.embeddingResult.count || 0} embeddings generated
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Method: {state.embeddingResult.method || embMethod} · Dimension: {state.embeddingResult.dimension || embDim}D
                    </p>
                    <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                      {(state.embeddingResult.embeddings || []).slice(0, 10).map((row, index) => (
                        <div key={index} className="flex gap-2 rounded-lg border border-border/50 px-3 py-2 text-xs">
                          <span className="min-w-0 flex-1 truncate font-medium">{row.name || 'Node'}</span>
                          <span className="font-mono text-muted-foreground">
                            [{Array.isArray(row.embedding) ? row.embedding.slice(0, 4).map((value) => Number(value).toFixed(3)).join(', ') : '...'}]
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-0 flex-1 items-center rounded-2xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
                    Run embedding generation to inspect vectors here.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTask === 'similarity' && (
            <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.84fr)]">
              <div className="space-y-3">
              <div className="rounded-2xl border border-teal-500/20 bg-teal-500/5 px-4 py-3 text-sm text-teal-700 dark:text-teal-300">
                  Finds nodes that behave similarly in the graph, even if their names are different.
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <MLField label="Top K">
                    <Input
                      type="number"
                      min="1"
                      max="50"
                      value={similarityTopK}
                      onChange={(e) => setSimilarityTopK(Number(e.target.value))}
                      disabled={isLoading}
                      className="h-10"
                    />
                  </MLField>
                  <MLField label="Cutoff">
                    <Input
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      value={similarityCutoff}
                      onChange={(e) => setSimilarityCutoff(Number(e.target.value))}
                      disabled={isLoading}
                      className="h-10"
                    />
                  </MLField>
                </div>

                <Button variant="gradient" className="h-10 w-full" onClick={runSimilarity} disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Find Similar Nodes
                </Button>
              </div>

              <div className="flex min-h-0 flex-col space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <GitCompareArrows className="h-4 w-4 text-teal-500" />
                  Similar items
                </div>
                {state.similarityResult ? (
                  <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-border/50 bg-background/40 p-4">
                    <p className="text-sm font-medium">
                      {state.similarityResult.count || 0} similar pairs found
                    </p>
                    <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                      {(state.similarityResult.similarities || []).slice(0, 12).map((row, index) => (
                        <div key={index} className="flex items-center gap-3 rounded-lg border border-border/50 px-3 py-2 text-xs">
                          <span className="min-w-0 flex-1 truncate font-medium">{row.source_name || 'Source'}</span>
                          <Badge variant="info">
                            {typeof row.similarity === 'number' ? `${(row.similarity * 100).toFixed(0)}%` : 'Match'}
                          </Badge>
                          <span className="min-w-0 flex-1 truncate text-right font-medium">{row.target_name || 'Target'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-0 flex-1 items-center rounded-2xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
                    Run similarity search to inspect structural matches here.
                  </div>
                )}
              </div>
            </div>
          )}

          {state.statusMsg && (
            <div className="flex items-center gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
              <Loader2 className="h-4 w-4 animate-spin" />
              {state.statusMsg}
            </div>
          )}

          {state.errorMsg && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {state.errorMsg}
            </div>
          )}

          {state.trainResult && (
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">Training complete</p>
                <p className="mt-1 text-xs opacity-80">
                  Model <span className="font-semibold">"{state.trainResult.model_name || state.trainResult.modelName || 'saved model'}"</span> is ready in the catalog.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
