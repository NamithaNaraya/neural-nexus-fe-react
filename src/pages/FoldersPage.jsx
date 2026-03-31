import React, { Suspense, lazy, useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Label } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { AnimatedNumber } from '../components/shared/AnimatedNumber';
import {
  FolderOpen,
  Plus,
  FileText,
  Network,
  Calendar,
  Trash2,
  ArrowLeft,
  ChevronRight,
  X,
  Loader2,
  GitFork,
  Search,
  Pencil,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { folderService } from '../services/folderService';
import { browseService } from '../services/browseService';
import { useGlobalFolder } from '../contexts/GlobalFolderContext';
import { FolderCrudModal } from '../components/crud';
const FolderNodesPanel = lazy(() => import('./folders/FolderNodesPanel').then((m) => ({ default: m.FolderNodesPanel })));
const FolderFilesPanel = lazy(() => import('./folders/FolderFilesPanel').then((m) => ({ default: m.FolderFilesPanel })));

export default function FoldersPage() {
  const { refreshFolders, selectedFolderId, setSelectedFolderId } = useGlobalFolder();
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [folderSearch, setFolderSearch] = useState('');
  const [folderContentSearch, setFolderContentSearch] = useState('');
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [selectedFolderTab, setSelectedFolderTab] = useState('nodes');
  const [folderFiles, setFolderFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(false);

  const [nodeTypes, setNodeTypes] = useState([]);
  const [selectedNodeType, setSelectedNodeType] = useState('');
  const [folderNodes, setFolderNodes] = useState([]);
  const [nodesLoading, setNodesLoading] = useState(false);
  const [nodeSearch, setNodeSearch] = useState('');
  const [nodesPage, setNodesPage] = useState(1);
  const [nodesTotalPages, setNodesTotalPages] = useState(0);
  const folderNodesCacheRef = useRef(new Map());
  const lastSyncedFolderIdRef = useRef('');
  const pendingFolderSyncRef = useRef('');

  const [deleting, setDeleting] = useState(null);
  const [editingFolder, setEditingFolder] = useState(null);
  const [showEdit, setShowEdit] = useState(false);

  const filteredFolders = useMemo(() => {
    const term = folderSearch.trim().toLowerCase();
    if (!term) return folders;

    return folders.filter((folder) => {
      const name = String(folder.name || '').toLowerCase();
      const description = String(folder.description || '').toLowerCase();
      const id = String(folder.id || '').toLowerCase();
      return name.includes(term) || description.includes(term) || id.includes(term);
    });
  }, [folders, folderSearch]);

  const filteredFolderNodes = useMemo(() => {
    const term = folderContentSearch.trim().toLowerCase();
    if (!term) return folderNodes;

    return folderNodes.filter((node) => {
      const name = String(node.name || '').toLowerCase();
      const type = String(node.type || '').toLowerCase();
      const id = String(node.id || '').toLowerCase();
      return name.includes(term) || type.includes(term) || id.includes(term);
    });
  }, [folderNodes, folderContentSearch]);

  const filteredFolderFiles = useMemo(() => {
    const term = folderContentSearch.trim().toLowerCase();
    if (!term) return folderFiles;

    return folderFiles.filter((file) => {
      const name = String(file.filename || '').toLowerCase();
      const type = String(file.file_type || '').toLowerCase();
      const status = String(file.status || '').toLowerCase();
      return name.includes(term) || type.includes(term) || status.includes(term);
    });
  }, [folderFiles, folderContentSearch]);

  const fetchFolders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await folderService.list();
      setFolders(data);
    } catch (err) {
      console.error('Failed to fetch folders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFolders(); }, [fetchFolders]);

  useEffect(() => {
    void import('./folders/FolderNodesPanel');
    void import('./folders/FolderFilesPanel');
  }, []);

  const createFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim() || creating) return;
    setCreating(true);
    try {
      const createdFolder = await folderService.create(newFolderName.trim(), newFolderDesc.trim() || null);
      setNewFolderName('');
      setNewFolderDesc('');
      setShowCreate(false);
      await fetchFolders();
      await refreshFolders();
      if (createdFolder?.id) setSelectedFolderId(String(createdFolder.id));
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create folder');
    } finally {
      setCreating(false);
    }
  };

  const deleteFolder = async (folderId) => {
    if (!confirm('Delete this folder and all its data? This cannot be undone.')) return;
    setDeleting(folderId);
    try {
      await folderService.delete(folderId);
      if (selectedFolder?.id === folderId) {
        setSelectedFolder(null);
        setFolderFiles([]);
      }
      await fetchFolders();
      await refreshFolders();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete folder');
    } finally {
      setDeleting(null);
    }
  };

  const fetchFolderNodeTypes = useCallback(async (folderId) => {
    try {
      const data = await browseService.getNodeTypes(folderId);
      const types = Array.isArray(data.types) ? data.types : [];
      setNodeTypes(types);
      const firstType = types.length > 0 ? types[0].type : '';
      setSelectedNodeType(firstType);
      if (firstType) {
        await fetchFolderNodes(folderId, firstType, 1, '');
      } else {
        setFolderNodes([]);
        setNodesTotalPages(0);
        setNodesLoading(false);
      }
    } catch (err) {
      console.error('Failed to fetch node types:', err);
      setNodeTypes([]);
      setFolderNodes([]);
      setSelectedNodeType('');
      setNodesTotalPages(0);
      setNodesLoading(false);
    }
  }, []);

  const fetchFolderNodes = useCallback(async (folderId, type, page = 1, q = '') => {
    const cacheKey = `${folderId}:${type}:${page}:${q}`;
    const cached = folderNodesCacheRef.current.get(cacheKey);
    if (cached) {
      setFolderNodes(cached.nodes);
      setNodesTotalPages(cached.totalPages);
      setNodesPage(cached.page);
      setNodesLoading(false);
      return;
    }

    setNodesLoading(true);
    try {
      const data = await browseService.getNodesByType(type, folderId, page, 20, q);
      const nodes = Array.isArray(data.nodes) ? data.nodes : [];
      const totalPages = data.total_pages || 0;
      const currentPage = data.page || 1;
      folderNodesCacheRef.current.set(cacheKey, {
        nodes,
        totalPages,
        page: currentPage,
      });
      setFolderNodes(nodes);
      setNodesTotalPages(totalPages);
      setNodesPage(currentPage);
    } catch (err) {
      console.error('Failed to fetch nodes by type:', err);
      setFolderNodes([]);
      setNodesTotalPages(0);
      setNodesPage(1);
    } finally {
      setNodesLoading(false);
    }
  }, []);

  const loadFolderDetails = useCallback(async (folder) => {
    setSelectedFolder(folder);
    lastSyncedFolderIdRef.current = String(folder.id);
    setNodeSearch('');
    setFolderContentSearch('');
    setFilesLoading(true);
    setNodesLoading(true);
    folderNodesCacheRef.current.clear();

    try {
      const [filesResult, nodeTypesResult] = await Promise.all([
        folderService.listFiles(folder.id),
        browseService.getNodeTypes(folder.id),
      ]);

      setFolderFiles(Array.isArray(filesResult) ? filesResult : []);

      const types = Array.isArray(nodeTypesResult?.types) ? nodeTypesResult.types : [];
      setNodeTypes(types);
      const firstType = types.length > 0 ? types[0].type : '';
      setSelectedNodeType(firstType);
      if (firstType) {
        await fetchFolderNodes(folder.id, firstType, 1, '');
      } else {
        setFolderNodes([]);
        setNodesTotalPages(0);
        setNodesLoading(false);
      }
    } catch (err) {
      console.error('Failed to fetch folder details:', err);
      setFolderFiles([]);
      setNodeTypes([]);
      setSelectedNodeType('');
      setFolderNodes([]);
      setNodesTotalPages(0);
      setNodesLoading(false);
    } finally {
      setFilesLoading(false);
    }
  }, [fetchFolderNodes]);

  const activateFolder = useCallback(async (folder) => {
    if (!folder) return;
    const folderId = String(folder.id);
    pendingFolderSyncRef.current = folderId;
    setSelectedFolderId(folderId);
    if (String(lastSyncedFolderIdRef.current) === folderId && String(selectedFolder?.id || '') === folderId) {
      return;
    }
    await loadFolderDetails(folder);
  }, [loadFolderDetails, selectedFolder?.id, setSelectedFolderId]);

  useEffect(() => {
    if (!selectedFolderId || folders.length === 0) return;

    const nextFolder = folders.find((folder) => String(folder.id) === String(selectedFolderId)) || null;

    if (!nextFolder) {
      pendingFolderSyncRef.current = '';
      setSelectedFolder(null);
      setFolderFiles([]);
      setNodeTypes([]);
      setSelectedNodeType('');
      setFolderNodes([]);
      setNodeSearch('');
      setFolderContentSearch('');
      setNodesPage(1);
      setNodesTotalPages(0);
      return;
    }

    if (String(pendingFolderSyncRef.current) === String(selectedFolderId)) {
      pendingFolderSyncRef.current = '';
      return;
    }

    if (String(selectedFolder?.id || '') === String(nextFolder.id)) {
      return;
    }

    void loadFolderDetails(nextFolder);
  }, [folders, loadFolderDetails, selectedFolder?.id, selectedFolderId]);

  const formatDate = (isoStr) => {
    if (!isoStr) return '—';
    return new Date(isoStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  useEffect(() => {
    if (!selectedFolder || !selectedNodeType || !nodeSearch) return;
    const timer = setTimeout(() => {
      fetchFolderNodes(selectedFolder.id, selectedNodeType, 1, nodeSearch);
    }, 400);
    return () => clearTimeout(timer);
  }, [nodeSearch, selectedFolder, selectedNodeType, fetchFolderNodes]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-6 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/80">
            Workspace Library
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Folders</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Organize your knowledge graph data into collections and find the right folder quickly.
            </p>
          </div>
        </div>
        <div className="flex w-full flex-col gap-3 lg:w-auto lg:min-w-[420px] lg:flex-row lg:items-center lg:justify-end">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={folderSearch}
              onChange={(e) => setFolderSearch(e.target.value)}
              placeholder="Search folders by name, description, or id..."
              className="h-11 pl-10"
            />
          </div>
          <Button
            variant="gradient"
            className="gap-2 shrink-0"
            onClick={() => setShowCreate(!showCreate)}
          >
            <Plus className="w-4 h-4" />
            New Folder
          </Button>
        </div>
      </div>

      {/* Create Folder Form */}
      {showCreate && (
        <Card className="animate-slide-down backdrop-blur-none bg-card">
          <CardContent className="p-5">
            <form onSubmit={createFolder} className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="folder-name">Folder Name</Label>
                  <Input
                    id="folder-name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="e.g. Herbal Medicine Research"
                    autoFocus
                    required
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label htmlFor="folder-desc">Description (optional)</Label>
                  <Input
                    id="folder-desc"
                    value={newFolderDesc}
                    onChange={(e) => setNewFolderDesc(e.target.value)}
                    placeholder="What's this folder about?"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" variant="gradient" disabled={creating} className="gap-2">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create Folder
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      <div className="grid flex-1 min-h-0 items-start grid-cols-1 gap-6 overflow-hidden lg:grid-cols-[minmax(18rem,1fr)_minmax(0,2fr)]">
        {/* Folder List */}
        <div className="self-start space-y-3">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
          ) : filteredFolders.length > 0 ? (
            <div className={cn(
              'grid gap-3',
              selectedFolder ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
            )}>
              {filteredFolders.map((folder) => (
                <Card
                  key={folder.id}
                  className={cn(
                    'cursor-pointer group backdrop-blur-none bg-card hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300',
                    (selectedFolder?.id === folder.id || String(selectedFolderId) === String(folder.id)) && 'border-primary/30 bg-primary/5'
                  )}
                  onClick={() => activateFolder(folder)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                          <FolderOpen className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm truncate">{folder.name}</h3>
                          {folder.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                              {folder.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              {folder.file_count} files
                            </span>
                            <span className="flex items-center gap-1">
                              <Network className="w-3 h-3" />
                              {folder.node_count} nodes
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingFolder(folder); setShowEdit(true); }}
                          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all duration-200"
                          title="Edit folder"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }}
                          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-red-500 transition-all duration-200"
                          title="Delete folder"
                        >
                          {deleting === folder.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="min-h-[300px] flex items-center justify-center">
              <CardContent className="text-center space-y-4 py-12">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                  <FolderOpen className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">
                    {folderSearch.trim() ? 'No matching folders' : 'No folders yet'}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {folderSearch.trim()
                      ? 'Try a different search term or clear the search box.'
                      : 'Create a folder to start organizing your datasets.'}
                  </p>
                </div>
                {!folderSearch.trim() && (
                  <Button variant="outline" className="gap-2" onClick={() => setShowCreate(true)}>
                    <Plus className="w-4 h-4" />
                    Create your first folder
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Folder Detail — Selected workspace */}
        {selectedFolder && (
          <div className="h-full min-h-0 overflow-hidden">
            <Card className="flex h-full min-h-0 flex-col overflow-hidden backdrop-blur-none bg-card">
              <div className="border-b border-border/30 px-5 py-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 px-2"
                      onClick={() => {
                        setSelectedFolder(null);
                        setFolderFiles([]);
                        setNodeTypes([]);
                        setSelectedNodeType('');
                        setFolderNodes([]);
                        setNodeSearch('');
                        setFolderContentSearch('');
                        setNodesPage(1);
                        setNodesTotalPages(0);
                      }}
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                      </Button>
                      <h2 className="font-semibold text-lg flex items-center gap-2 min-w-0">
                        <FolderOpen className="w-5 h-5 text-primary shrink-0" />
                        <span className="truncate">{selectedFolder.name}</span>
                      </h2>
                    </div>
                    {selectedFolder.description && String(selectedFolder.description).trim() !== String(selectedFolder.name || '').trim() && (
                      <p className="text-xs text-muted-foreground mt-1 max-w-3xl">{selectedFolder.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFolder(null);
                      setFolderFiles([]);
                      setNodeTypes([]);
                      setSelectedNodeType('');
                      setFolderNodes([]);
                      setNodeSearch('');
                      setFolderContentSearch('');
                      setNodesPage(1);
                      setNodesTotalPages(0);
                    }}
                    className="hidden rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground lg:inline-flex"
                    aria-label="Close folder details"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <CardContent className="flex flex-1 min-h-0 flex-col gap-5 p-5">
                <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
                  <div className="rounded-2xl border border-border/30 bg-muted/20 p-3 text-center">
                    <p className="text-xl font-bold"><AnimatedNumber value={selectedFolder.file_count} /></p>
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">Files</p>
                  </div>
                  <div className="rounded-2xl border border-border/30 bg-muted/20 p-3 text-center">
                    <p className="text-xl font-bold"><AnimatedNumber value={selectedFolder.node_count} /></p>
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">Nodes</p>
                  </div>
                  <div className="rounded-2xl border border-border/30 bg-muted/20 p-3 text-center">
                    <p className="text-lg font-bold">{formatDate(selectedFolder.updated_at)}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">Updated</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 rounded-2xl border border-border/30 bg-background/50 p-2">
                  {[
                    { id: 'nodes', label: 'Nodes' },
                    { id: 'files', label: 'Files' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSelectedFolderTab(tab.id)}
                      className={cn(
                        'rounded-xl px-4 py-2 text-sm font-medium transition',
                        selectedFolderTab === tab.id
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="relative flex-1 min-h-0 overflow-hidden">
                  <Suspense
                    fallback={(
                      <div className="rounded-2xl border border-border/30 bg-background/70 p-4">
                        <div className="space-y-3">
                          <Skeleton className="h-5 w-40" />
                          <Skeleton className="h-10 w-full" />
                          <Skeleton className="h-10 w-2/3" />
                          <Skeleton className="h-14 w-full" />
                          <Skeleton className="h-14 w-full" />
                        </div>
                      </div>
                    )}
                  >
                    <FolderNodesPanel
                      active={selectedFolderTab === 'nodes'}
                      folderContentSearch={folderContentSearch}
                      setFolderContentSearch={setFolderContentSearch}
                      nodeTypes={nodeTypes}
                      selectedNodeType={selectedNodeType}
                      setSelectedNodeType={setSelectedNodeType}
                      selectedFolder={selectedFolder}
                      nodeSearch={nodeSearch}
                      setNodeSearch={setNodeSearch}
                      fetchFolderNodes={fetchFolderNodes}
                      nodesLoading={nodesLoading}
                      filteredFolderNodes={filteredFolderNodes}
                    />
                  </Suspense>

                  <Suspense
                    fallback={(
                      <div className="rounded-2xl border border-border/30 bg-background/70 p-4">
                        <div className="space-y-3">
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-10 w-full" />
                          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
                        </div>
                      </div>
                    )}
                  >
                    <FolderFilesPanel
                      active={selectedFolderTab === 'files'}
                      folderContentSearch={folderContentSearch}
                      setFolderContentSearch={setFolderContentSearch}
                      filesLoading={filesLoading}
                      filteredFolderFiles={filteredFolderFiles}
                    />
                  </Suspense>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <FolderCrudModal
        open={showEdit}
        mode="edit"
        initialFolder={editingFolder}
        onClose={() => setShowEdit(false)}
        onSuccess={async () => {
          await fetchFolders();
          await refreshFolders();
        }}
      />
    </div>
  );
}
