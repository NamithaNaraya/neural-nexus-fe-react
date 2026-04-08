import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, GitBranch, Link2, Pencil, RefreshCw, Save, Sparkles, Target, X } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Input, Label } from '../../components/ui/Input';
import { graphService } from '../../services/graphService';
import { GraphFocusConnections } from './GraphFocusConnections';

function resolveValue(value) {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'object') {
    return value.name || value.label || value.id || value.type || JSON.stringify(value);
  }
  return String(value);
}

function parseProperties(text) {
  if (!text.trim()) return {};
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    const result = {};
    text.split('\n').forEach((line) => {
      const [key, ...rest] = line.split(':');
      if (!key || rest.length === 0) return;
      result[key.trim()] = rest.join(':').trim();
    });
    return result;
  }
}

function formatEntries(entries, limit = 8) {
  return Object.entries(entries || {})
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .slice(0, limit);
}

function DetailRow({ label, value }) {
  return (
    <div className="rounded-xl border border-border/40 bg-background/50 px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className="mt-1 break-words text-sm font-medium">{resolveValue(value)}</div>
    </div>
  );
}

function EditableTextarea({ label, value, onChange, rows = 4, placeholder }) {
  return (
    <div className="space-y-2">
      <Label className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</Label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="flex w-full rounded-xl border border-input bg-background/50 px-3 py-2 text-sm backdrop-blur-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-ring/50"
      />
    </div>
  );
}

export function GraphFocusDrawer({
  open,
  folderId,
  focusLabel,
  focusType,
  focusLoading,
  activeNode,
  activeRelationship,
  links = [],
  onClose,
  onEdit,
  onSelectNode,
  onSelectLink,
  relationshipTypeOptions = [],
  expandDepth = 1,
  setExpandDepth,
  expandRelationshipTypes = [],
  setExpandRelationshipTypes,
  onExpandNode,
  expandLoading = false,
  onSuccess,
}) {
  const [nodeForm, setNodeForm] = useState({
    name: '',
    type: '',
    description: '',
    notes: '',
    color: '',
    size: '',
    propertiesText: '{}',
  });
  const [relationshipForm, setRelationshipForm] = useState({
    type: '',
    strength: '',
    propertiesText: '{}',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!activeNode) return;
    setNodeForm({
      name: activeNode.name || '',
      type: activeNode.type || '',
      description: activeNode.description || '',
      notes: activeNode.properties?.notes || activeNode.properties?.user_notes || '',
      color: activeNode.color || '',
      size: activeNode.size ?? '',
      propertiesText: JSON.stringify(activeNode.properties || {}, null, 2),
    });
    setError('');
  }, [activeNode]);

  useEffect(() => {
    if (!activeRelationship) return;
    setRelationshipForm({
      type: activeRelationship.type || '',
      strength: activeRelationship.strength ?? '',
      propertiesText: JSON.stringify(activeRelationship.properties || {}, null, 2),
    });
    setError('');
  }, [activeRelationship]);

  const nodeProperties = useMemo(() => formatEntries(activeNode?.properties), [activeNode]);
  const relationshipProperties = useMemo(() => formatEntries(activeRelationship?.properties), [activeRelationship]);
  const relationSummary = activeRelationship
    ? `${resolveValue(activeRelationship.source)} -> ${resolveValue(activeRelationship.target)}`
    : '';

  const neighboringNodes = useMemo(() => {
    if (!activeNode?.id) return [];

    const seen = new Set();
    return links.reduce((collection, link) => {
      const source = typeof link.source === 'object' ? link.source : { id: link.source, name: link.source };
      const target = typeof link.target === 'object' ? link.target : { id: link.target, name: link.target };
      const currentId = String(activeNode.id);
      let neighbor = null;
      let direction = '';

      if (String(source.id) === currentId) {
        neighbor = target;
        direction = 'Outgoing';
      } else if (String(target.id) === currentId) {
        neighbor = source;
        direction = 'Incoming';
      }

      if (!neighbor?.id || seen.has(String(neighbor.id))) return collection;
      seen.add(String(neighbor.id));
      collection.push({
        id: neighbor.id,
        name: neighbor.name || neighbor.label || neighbor.id,
        type: neighbor.type || 'Unknown',
        direction,
      });
      return collection;
    }, []);
  }, [activeNode, links]);

  const handleSaveNode = async () => {
    const isNew = activeNode?.isPhantom;
    if (!isNew && !activeNode?.id) return;
    setSaving(true);
    setError('');
    try {
      const properties = parseProperties(nodeForm.propertiesText);
      const noteValue = nodeForm.notes.trim();
      if (noteValue) {
        properties.notes = noteValue;
      } else {
        delete properties.notes;
        delete properties.user_notes;
      }

      const payload = {
        name: nodeForm.name.trim(),
        type: nodeForm.type.trim() || 'Node',
        description: nodeForm.description.trim(),
        color: nodeForm.color.trim() || undefined,
        size: nodeForm.size === '' ? undefined : Number(nodeForm.size),
        properties,
        folder_id: folderId || undefined,
      };

      if (isNew) {
        // Add coordinates if phantom
        if (activeNode.x !== undefined) payload.x = activeNode.x;
        if (activeNode.y !== undefined) payload.y = activeNode.y;
        await graphService.createNode(payload);
      } else {
        await graphService.updateNode(activeNode.id, payload);
      }
      onSuccess?.();
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'Could not save node.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRelationship = async () => {
    const isNew = activeRelationship?.isPhantom;
    if (!isNew && !activeRelationship?.id) return;
    setSaving(true);
    setError('');
    try {
      const payload = {
        type: relationshipForm.type.trim() || 'RELATIONSHIP',
        strength: relationshipForm.strength === '' ? undefined : Number(relationshipForm.strength),
        properties: parseProperties(relationshipForm.propertiesText),
        folder_id: folderId || undefined,
      };

      if (isNew) {
        payload.source_node_id = activeRelationship.source;
        payload.target_node_id = activeRelationship.target;
        await graphService.createRelationship(payload);
      } else {
        await graphService.updateRelationship(activeRelationship.id, payload);
      }
      onSuccess?.();
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'Could not save relationship.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <aside
      className={[
        'absolute bottom-5 right-5 top-5 z-20 w-[360px] overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/96 shadow-[0_26px_70px_rgba(15,23,42,0.14)] backdrop-blur-xl transition-all duration-300 ease-out',
        open ? 'translate-x-0 opacity-100' : 'translate-x-[calc(100%+24px)] opacity-0 pointer-events-none',
      ].join(' ')}
    >
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex items-center justify-between border-b border-slate-200/80 px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-slate-200 bg-slate-50 text-[10px] uppercase tracking-[0.18em] text-slate-600">
                Inspector
              </Badge>
              <span className="text-sm font-semibold text-slate-900">Focused details</span>
            </div>
            <p className="mt-1 max-w-[240px] text-xs leading-5 text-muted-foreground">
              Inspect a node, move through neighbors, and edit graph details without losing the canvas.
            </p>
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-slate-50" type="button" onClick={onClose} aria-label="Close inspector">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {!focusLabel ? (
            <Card className="border-dashed border-border/50 bg-background/40">
              <CardContent className="space-y-3 p-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 text-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Start exploring
                </div>
                <p>Click a node to inspect its neighbors and paths, or click a relationship to focus that directed link.</p>
              </CardContent>
            </Card>
          ) : null}

          {focusLoading ? (
            <Card className="border-border/50 bg-card/60">
              <CardContent className="flex items-center gap-3 p-4 text-sm text-muted-foreground">
                <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-primary" />
                Loading nearby graph details...
              </CardContent>
            </Card>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          ) : null}

          {activeNode ? (
            <Card className="border-border/50 bg-card/70 shadow-sm">
              <CardContent className="space-y-4 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-semibold">{activeNode.isPhantom ? 'Create new node' : 'Node details'}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {activeNode.isPhantom ? 'Configure your new graph node before saving.' : 'This node is driving the current focused graph view.'}
                    </p>
                  </div>
                  {onEdit ? (
                    <Button variant="outline" size="sm" className="gap-2" type="button" onClick={onEdit}>
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Button>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/10">{activeNode.type || 'Unknown type'}</Badge>
                  <Badge variant="outline">{activeNode.degree ?? 0} connections</Badge>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Name</Label>
                    <Input value={nodeForm.name} onChange={(event) => setNodeForm((prev) => ({ ...prev, name: event.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Type</Label>
                    <Input value={nodeForm.type} onChange={(event) => setNodeForm((prev) => ({ ...prev, type: event.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Degree</Label>
                    <Input value={String(activeNode.degree ?? 0)} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Color</Label>
                    <Input value={nodeForm.color} onChange={(event) => setNodeForm((prev) => ({ ...prev, color: event.target.value }))} placeholder="#A78BFA" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Size</Label>
                    <Input value={nodeForm.size} onChange={(event) => setNodeForm((prev) => ({ ...prev, size: event.target.value }))} placeholder="1" />
                  </div>
                </div>

                <EditableTextarea
                  label="Description"
                  value={nodeForm.description}
                  onChange={(value) => setNodeForm((prev) => ({ ...prev, description: value }))}
                  rows={3}
                  placeholder="Short description"
                />

                <EditableTextarea
                  label="Notes"
                  value={nodeForm.notes}
                  onChange={(value) => setNodeForm((prev) => ({ ...prev, notes: value }))}
                  rows={4}
                  placeholder="Add analyst notes, reminders, or interpretation"
                />

                <EditableTextarea
                  label="Properties"
                  value={nodeForm.propertiesText}
                  onChange={(value) => setNodeForm((prev) => ({ ...prev, propertiesText: value }))}
                  rows={6}
                  placeholder='{"key":"value"} or key: value per line'
                />

                <div className="flex items-center justify-end gap-3">
                  <Button variant="gradient" size="sm" className="gap-2" onClick={handleSaveNode} disabled={saving} type="button">
                    <Save className="h-4 w-4" />
                    {activeNode.isPhantom ? 'Create Node' : 'Save Node'}
                  </Button>
                </div>

                {neighboringNodes.length > 0 ? (
                  <div className="space-y-3 rounded-2xl border border-border/40 bg-background/40 p-3">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Neighbors</div>
                        <p className="mt-1 text-xs text-muted-foreground">Move through the graph from this node one neighbor at a time.</p>
                      </div>
                    </div>
                    <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                      {neighboringNodes.map((neighbor) => (
                        <button
                          key={neighbor.id}
                          type="button"
                          onClick={() => onSelectNode?.(neighbor)}
                          className="flex w-full items-center justify-between gap-3 rounded-xl border border-border/40 bg-white px-3 py-2 text-left transition hover:border-primary/30 hover:bg-primary/5"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">{neighbor.name}</div>
                            <div className="truncate text-xs text-muted-foreground">{neighbor.direction} • {neighbor.type}</div>
                          </div>
                          <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="space-y-3 rounded-2xl border border-border/40 bg-background/40 p-3">
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-primary" />
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Expansion controls</div>
                      <p className="mt-1 text-xs text-muted-foreground">Reload this node with deeper hops or narrower relationship types.</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Depth</Label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3].map((depth) => (
                        <Button
                          key={depth}
                          variant={expandDepth === depth ? 'outline' : 'ghost'}
                          size="sm"
                          className="rounded-full"
                          onClick={() => setExpandDepth?.(depth)}
                        >
                          {depth} hop{depth === 1 ? '' : 's'}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {relationshipTypeOptions.length ? (
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Relationship types</Label>
                      <div className="flex flex-wrap gap-2">
                        {relationshipTypeOptions.slice(0, 12).map((type) => {
                          const active = expandRelationshipTypes.includes(type);
                          return (
                            <button
                              key={type}
                              type="button"
                              onClick={() => {
                                if (!setExpandRelationshipTypes) return;
                                setExpandRelationshipTypes((current) => (
                                  current.includes(type)
                                    ? current.filter((item) => item !== type)
                                    : [...current, type]
                                ));
                              }}
                              className={[
                                'rounded-full border px-3 py-1.5 text-xs font-medium transition',
                                active
                                  ? 'border-primary/40 bg-primary/10 text-primary'
                                  : 'border-border/40 bg-background/50 text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                              ].join(' ')}
                            >
                              {type}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 rounded-full"
                      onClick={onExpandNode}
                      disabled={expandLoading}
                    >
                      <RefreshCw className={`h-4 w-4 ${expandLoading ? 'animate-spin' : ''}`} />
                      Refresh neighborhood
                    </Button>
                  </div>
                </div>

                {nodeProperties.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Existing properties</div>
                    <div className="space-y-2">
                      {nodeProperties.map(([key, value]) => (
                        <DetailRow key={key} label={key} value={value} />
                      ))}
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {activeRelationship ? (
            <Card className="border-border/50 bg-card/70 shadow-sm">
              <CardContent className="space-y-4 p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">{activeRelationship.isPhantom ? 'Create relationship' : 'Relationship details'}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {activeRelationship.isPhantom ? 'Define relationship type and attributes.' : 'This link is isolated with its source-to-target direction preserved.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300">
                    {activeRelationship.type || 'Relationship'}
                  </Badge>
                  <Badge variant="outline">{relationSummary || 'Linked nodes'}</Badge>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Source</Label>
                    <Input value={resolveValue(activeRelationship.source)} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Target</Label>
                    <Input value={resolveValue(activeRelationship.target)} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Type</Label>
                    <Input
                      value={relationshipForm.type}
                      onChange={(event) => setRelationshipForm((prev) => ({ ...prev, type: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Strength</Label>
                    <Input
                      value={relationshipForm.strength}
                      onChange={(event) => setRelationshipForm((prev) => ({ ...prev, strength: event.target.value }))}
                      placeholder="1"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">ID</Label>
                    <Input value={activeRelationship.id || activeRelationship.key || '-'} disabled />
                  </div>
                </div>

                <EditableTextarea
                  label="Properties"
                  value={relationshipForm.propertiesText}
                  onChange={(value) => setRelationshipForm((prev) => ({ ...prev, propertiesText: value }))}
                  rows={5}
                  placeholder='{"key":"value"} or key: value per line'
                />

                <div className="flex items-center justify-end gap-3">
                  <Button variant="gradient" size="sm" className="gap-2" onClick={handleSaveRelationship} disabled={saving} type="button">
                    <Save className="h-4 w-4" />
                    {activeRelationship.isPhantom ? 'Create Link' : 'Save Link'}
                  </Button>
                </div>

                {relationshipProperties.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Existing properties
                    </div>
                    <div className="space-y-2">
                      {relationshipProperties.map(([key, value]) => (
                        <DetailRow key={key} label={key} value={value} />
                      ))}
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {focusType === 'node' && links.length > 0 ? (
            <GraphFocusConnections activeNode={activeNode} links={links} onSelectLink={onSelectLink} />
          ) : null}
        </div>
      </div>
    </aside>
  );
}
