import React, { useEffect, useMemo, useState } from 'react';
import { Link2, Save, Sparkles, Target, X } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Input, Label } from '../../components/ui/Input';
import { graphService } from '../../services/graphService';
import { GraphFocusConnections } from './GraphFocusConnections';

function resolveValue(value) {
  if (value === null || value === undefined || value === '') return '—';
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
  onSelectLink,
}) {
  const [nodeForm, setNodeForm] = useState({
    name: '',
    type: '',
    description: '',
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
    ? `${resolveValue(activeRelationship.source)} → ${resolveValue(activeRelationship.target)}`
    : '';

  const handleSaveNode = async () => {
    if (!activeNode?.id) return;
    setSaving(true);
    setError('');
    try {
      await graphService.updateNode(activeNode.id, {
        name: nodeForm.name.trim(),
        type: nodeForm.type.trim(),
        description: nodeForm.description.trim(),
        color: nodeForm.color.trim() || undefined,
        size: nodeForm.size === '' ? undefined : Number(nodeForm.size),
        properties: parseProperties(nodeForm.propertiesText),
        folder_id: folderId || undefined,
      });
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'Could not save node.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRelationship = async () => {
    if (!activeRelationship?.id) return;
    setSaving(true);
    setError('');
    try {
      await graphService.updateRelationship(activeRelationship.id, {
        type: relationshipForm.type.trim(),
        strength: relationshipForm.strength === '' ? undefined : Number(relationshipForm.strength),
        properties: parseProperties(relationshipForm.propertiesText),
        folder_id: folderId || undefined,
      });
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'Could not save relationship.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <aside
      className={[
        'absolute inset-y-0 right-0 z-20 w-[360px] border-l border-border/50 bg-background/88 shadow-2xl backdrop-blur-xl transition-transform duration-300 ease-out',
        open ? 'translate-x-0' : 'translate-x-[calc(100%+20px)] pointer-events-none',
      ].join(' ')}
    >
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] uppercase tracking-[0.18em]">
                Inspector
              </Badge>
              <span className="text-sm font-semibold">Focused details</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Edit the active node or relationship while the graph stays clean.
            </p>
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" type="button" onClick={onClose} aria-label="Close inspector">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {!focusLabel ? (
            <Card className="border-dashed border-border/50 bg-background/40">
              <CardContent className="space-y-3 p-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 text-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Start exploring
                </div>
                <p>Click a node to inspect its neighborhood or click a relationship to focus that link.</p>
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
                      <h3 className="text-sm font-semibold">Node details</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">This node is now driving the focused graph view.</p>
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
                    <Input value={nodeForm.name} onChange={(e) => setNodeForm((prev) => ({ ...prev, name: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Type</Label>
                    <Input value={nodeForm.type} onChange={(e) => setNodeForm((prev) => ({ ...prev, type: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Degree</Label>
                    <Input value={String(activeNode.degree ?? 0)} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Color</Label>
                    <Input value={nodeForm.color} onChange={(e) => setNodeForm((prev) => ({ ...prev, color: e.target.value }))} placeholder="#7C6CF2" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Size</Label>
                    <Input value={nodeForm.size} onChange={(e) => setNodeForm((prev) => ({ ...prev, size: e.target.value }))} placeholder="1" />
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
                  label="Properties"
                  value={nodeForm.propertiesText}
                  onChange={(value) => setNodeForm((prev) => ({ ...prev, propertiesText: value }))}
                  rows={6}
                  placeholder='{"key":"value"} or key: value per line'
                />

                <div className="flex items-center justify-end gap-3">
                  <Button variant="gradient" size="sm" className="gap-2" onClick={handleSaveNode} disabled={saving} type="button">
                    <Save className="h-4 w-4" />
                    Save Node
                  </Button>
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
                    <h3 className="text-sm font-semibold">Relationship details</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">This link is isolated in the focused graph.</p>
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
                      onChange={(e) => setRelationshipForm((prev) => ({ ...prev, type: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Strength</Label>
                    <Input
                      value={relationshipForm.strength}
                      onChange={(e) => setRelationshipForm((prev) => ({ ...prev, strength: e.target.value }))}
                      placeholder="1"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">ID</Label>
                    <Input value={activeRelationship.id || activeRelationship.key || '—'} disabled />
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
                    Save Link
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
            <GraphFocusConnections links={links} onSelectLink={onSelectLink} />
          ) : null}
        </div>
      </div>
    </aside>
  );
}
