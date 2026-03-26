import React, { useState, useEffect, useCallback } from 'react';
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
  ChevronRight,
  X,
  Loader2,
  GitFork,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { folderService } from '../services/folderService';
import { browseService } from '../services/browseService';
import { useGlobalFolder } from '../contexts/GlobalFolderContext';

export default function FoldersPage() {
  const { refreshFolders, setSelectedFolderId } = useGlobalFolder();
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [folderFiles, setFolderFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(false);

  const [nodeTypes, setNodeTypes] = useState([]);
  const [selectedNodeType, setSelectedNodeType] = useState('');
  const [folderNodes, setFolderNodes] = useState([]);
  const [nodesLoading, setNodesLoading] = useState(false);
  const [nodeSearch, setNodeSearch] = useState('');
  const [nodesPage, setNodesPage] = useState(1);
  const [nodesTotalPages, setNodesTotalPages] = useState(0);

  const [deleting, setDeleting] = useState(null);

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
    setNodesLoading(true);
    try {
      const data = await browseService.getNodesByType(type, folderId, page, 20, q);
      setFolderNodes(Array.isArray(data.nodes) ? data.nodes : []);
      setNodesTotalPages(data.total_pages || 0);
      setNodesPage(data.page || 1);
    } catch (err) {
      console.error('Failed to fetch nodes by type:', err);
      setFolderNodes([]);
      setNodesTotalPages(0);
      setNodesPage(1);
    } finally {
      setNodesLoading(false);
    }
  }, []);

  const openFolder = async (folder) => {
    setSelectedFolder(folder);
    setFolderFiles([]);
    setNodeTypes([]);
    setSelectedNodeType('');
    setFolderNodes([]);
    setNodeSearch('');
    setNodesPage(1);
    setNodesTotalPages(0);

    setFilesLoading(true);
    try {
      const files = await folderService.listFiles(folder.id);
      setFolderFiles(files);
    } catch (err) {
      console.error('Failed to fetch files:', err);
      setFolderFiles([]);
    } finally {
      setFilesLoading(false);
    }

    try {
      await fetchFolderNodeTypes(folder.id);
    } catch (err) {
      console.error('fetchFolderNodeTypes error:', err);
    }
  };

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
  }, [nodeSearch, selectedFolder, selectedNodeType]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="gradient-text">Folders</span>
          </h1>
          <p className="text-muted-foreground text-sm">
            Organize your knowledge graph data into collections.
          </p>
        </div>
        <Button
          variant="gradient"
          className="gap-2"
          onClick={() => setShowCreate(!showCreate)}
        >
          <Plus className="w-4 h-4" />
          New Folder
        </Button>
      </div>

      {/* Create Folder Form */}
      {showCreate && (
        <Card className="animate-slide-down">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Folder List */}
        <div className={cn('space-y-3', selectedFolder ? 'lg:col-span-1' : 'lg:col-span-3')}>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
          ) : folders.length > 0 ? (
            <div className={cn(
              'grid gap-3',
              selectedFolder ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            )}>
              {folders.map((folder) => (
                <Card
                  key={folder.id}
                  className={cn(
                    'cursor-pointer group hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300',
                    selectedFolder?.id === folder.id && 'border-primary/30 bg-primary/5'
                  )}
                  onClick={() => openFolder(folder)}
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
                  <h2 className="text-lg font-semibold">No folders yet</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create a folder to start organizing your datasets.
                  </p>
                </div>
                <Button variant="outline" className="gap-2" onClick={() => setShowCreate(true)}>
                  <Plus className="w-4 h-4" />
                  Create your first folder
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Folder Detail — Files inside selected folder */}
        {selectedFolder && (
          <div className="lg:col-span-2 animate-fade-up">
            <Card>
              <div className="p-5 border-b border-border/30 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-lg flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-primary" />
                    {selectedFolder.name}
                  </h2>
                  {selectedFolder.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{selectedFolder.description}</p>
                  )}
                </div>
                <button
                  onClick={() => { setSelectedFolder(null); setFolderFiles([]); }}
                  className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <CardContent className="p-5">
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="p-3 rounded-lg bg-muted/20 border border-border/30 text-center">
                    <p className="text-xl font-bold"><AnimatedNumber value={selectedFolder.file_count} /></p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Files</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/20 border border-border/30 text-center">
                    <p className="text-xl font-bold"><AnimatedNumber value={selectedFolder.node_count} /></p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Nodes</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/20 border border-border/30 text-center">
                    <p className="text-xl font-bold">{formatDate(selectedFolder.updated_at)}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Updated</p>
                  </div>
                </div>

                {/* Browse / node inspector */}
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">Graph nodes</h3>
                    <span className="text-xs text-muted-foreground">{folderNodes.length} found</span>
                  </div>

                  <div className="flex gap-2 flex-wrap mb-3">
                    {nodeTypes.length > 0 ? nodeTypes.map((nodeType) => (
                      <button
                        key={nodeType.type}
                        type="button"
                        onClick={() => {
                          setSelectedNodeType(nodeType.type);
                          setNodesPage(1);
                          fetchFolderNodes(selectedFolder.id, nodeType.type, 1, nodeSearch);
                        }}
                        className={cn(
                          'px-3 py-1.5 text-xs rounded-full border transition',
                          selectedNodeType === nodeType.type
                            ? 'bg-primary text-white border-primary'
                            : 'bg-muted/10 border-border/50 text-muted-foreground hover:bg-muted/20'
                        )}
                      >
                        {nodeType.type} ({nodeType.count})
                      </button>
                    )) : (
                      <span className="text-xs text-muted-foreground">No node types found in folder.</span>
                    )}
                  </div>

                  <Input
                    value={nodeSearch}
                    onChange={(e) => setNodeSearch(e.target.value)}
                    placeholder="Filter nodes by name..."
                    className="mb-3 h-9"
                  />

                  <div className="space-y-2 max-h-40 overflow-y-auto mb-4 min-h-[40px]">
                    {nodesLoading ? (
                      <div className="space-y-2 transition-opacity duration-200">
                        {[1, 2, 3, 4, 5].map((x) => (
                          <Skeleton key={x} className="h-10 rounded-lg" />
                        ))}
                      </div>
                    ) : folderNodes.length > 0 ? (
                      <div className="space-y-2 transition-opacity duration-200">
                        {folderNodes.map((node) => (
                          <div key={node.id} className="rounded-lg border border-border/20 bg-muted/10 px-3 py-2 text-xs hover:bg-muted/20 transition-colors duration-150">
                            <div className="font-medium truncate">{node.name}</div>
                            <div className="text-muted-foreground truncate text-[11px]">{node.type}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-border/20 bg-muted/10 p-3 text-xs text-muted-foreground transition-opacity duration-200">
                        No nodes loaded, select a type or check folder contents.
                      </div>
                    )}
                  </div>
                </div>

                {/* File list */}
                {filesLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 rounded-lg" />)}
                  </div>
                ) : folderFiles.length > 0 ? (
                  <div className="space-y-2">
                    {folderFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/10 border border-border/20 hover:bg-muted/20 transition-colors duration-200"
                      >
                        <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.filename}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant={file.status === 'completed' ? 'success' : file.status === 'processing' ? 'info' : 'secondary'} className="text-[10px]">
                              {file.status}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Network className="w-2.5 h-2.5" /> {file.node_count} nodes
                            </span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <GitFork className="w-2.5 h-2.5" /> {file.relationship_count} rels
                            </span>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-[10px] uppercase shrink-0">
                          {file.file_type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>No files in this folder</p>
                    <p className="text-xs mt-1 text-muted-foreground/50">Upload files on the Upload page</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
