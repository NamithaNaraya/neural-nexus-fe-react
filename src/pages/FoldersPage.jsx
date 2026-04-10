import React, { Suspense, lazy, useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { IconButton } from '../components/ui/IconButton';
import { Flex } from '@chakra-ui/react';
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
  AlertTriangle,
  LayoutGrid,
  List,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { folderService } from '../services/folderService';
import { browseService } from '../services/browseService';
import { useGlobalFolder } from '../contexts/GlobalFolderContext';
import { FolderCrudModal } from '../components/crud';

const FolderNodesPanel = lazy(() => import('./folders/FolderNodesPanel').then((m) => ({ default: m.FolderNodesPanel })));
const FolderFilesPanel = lazy(() => import('./folders/FolderFilesPanel').then((m) => ({ default: m.FolderFilesPanel })));

const FolderCardSkeleton = ({ mode = 'grid' }) => {
  if (mode === 'list') {
    return (
      <Card className="backdrop-blur-none bg-card/50 overflow-hidden border-border/10">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <div className="flex gap-3 shrink-0 mr-4">
              <Skeleton className="h-5 w-12 rounded-lg" />
              <Skeleton className="h-5 w-12 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
            <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="backdrop-blur-none bg-card/50 overflow-hidden border-border/10">
      <CardContent className="p-7">
        <div className="flex items-start gap-5">
          <Skeleton className="w-14 h-14 rounded-2xl shrink-0" />
          <div className="flex-1 space-y-3 py-1">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
        <div className="flex gap-4 mt-6">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </CardContent>
    </Card>
  );
};

const DetailPanelSkeleton = () => (
  <Card className="flex h-full min-h-0 flex-col overflow-hidden backdrop-blur-none bg-card border-border/10">
    <div className="border-b border-border/20 px-5 py-4 space-y-3">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-6 w-1/2" />
    </div>
    <CardContent className="p-5 flex-1 space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
      </div>
      <Skeleton className="h-12 rounded-2xl w-full" />
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </CardContent>
  </Card>
);

export default function FoldersPage() {
  const { refreshFolders, selectedFolderId, setSelectedFolderId } = useGlobalFolder();
  const [folders, setFolders] = useState([]);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('folder_view_mode') || 'grid');

  useEffect(() => {
    localStorage.setItem('folder_view_mode', viewMode);
  }, [viewMode]);
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
  const [deletePromptFolder, setDeletePromptFolder] = useState(null);
  const [editingFolder, setEditingFolder] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

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

  const resetFolderSelection = useCallback(() => {
    setSelectedFolder(null);
    setSelectedFolderId('');
    setSelectedFolderTab('nodes');
    setFolderContentSearch('');
    setNodeSearch('');
    setSelectedNodeType('');
    setFolderFiles([]);
    setNodeTypes([]);
    setFolderNodes([]);
    setNodesPage(1);
    setNodesTotalPages(0);
    lastSyncedFolderIdRef.current = '';
    pendingFolderSyncRef.current = '';
  }, [setSelectedFolderId]);

  const fetchFolders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await folderService.list();
      setFolders(data);
    } catch (err) {
      console.error('Failed to fetch folders:', err);
    } finally {
      // Small artificial delay for skeleton feel parity
      setTimeout(() => setLoading(false), 300);
    }
  }, []);

  useEffect(() => { fetchFolders(); }, [fetchFolders]);

  const createFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim() || creating) return;
    setStatusMessage('');
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
      setStatusMessage(err.response?.data?.detail || 'Failed to create folder');
    } finally {
      setCreating(false);
    }
  };

  const deleteFolder = async (folderId) => {
    setDeleting(folderId);
    setStatusMessage('');
    try {
      await folderService.delete(folderId);
      if (selectedFolder?.id === folderId) {
        resetFolderSelection();
      }
      await fetchFolders();
      await refreshFolders();
    } catch (err) {
      setStatusMessage(err.response?.data?.detail || 'Failed to delete folder');
    } finally {
      setDeleting(null);
    }
  };

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
  }, [fetchFolderNodes, resetFolderSelection]);

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
      resetFolderSelection();
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
  }, [folders, loadFolderDetails, resetFolderSelection, selectedFolder?.id, selectedFolderId]);

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
    <section aria-labelledby="folders-page-title" className="flex h-full min-h-0 flex-col gap-6 overflow-hidden">
      {statusMessage ? (
        <div role="alert" aria-live="polite" className="rounded-2xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {statusMessage}
        </div>
      ) : null}
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1.5">
          <Badge variant="secondary" className="px-3 py-1 text-[10px] bg-primary/10 text-primary border-none uppercase tracking-widest font-black">
            Personal Workspace
          </Badge>
          <div className="space-y-1">
            <h1 id="folders-page-title" className="text-3xl font-extrabold tracking-tight text-foreground">Folders</h1>
            <p className="max-w-2xl text-[13px] text-muted-foreground font-medium">
              Orchestrate your knowledge graph data into collections and discover insights.
            </p>
          </div>
        </div>
        <div className="flex w-full flex-col gap-3 lg:w-auto lg:min-w-[420px] lg:flex-row lg:items-center lg:justify-end">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
            <Input
              aria-label="Search folders"
              value={folderSearch}
              onChange={(e) => setFolderSearch(e.target.value)}
              placeholder="Quick search library..."
              className="h-11 pl-11 rounded-2xl border-border/40 focus:ring-primary/20"
            />
          </div>
          <div className="flex items-center gap-2 p-1.5 bg-whiteAlpha.50 rounded-2xl border border-border/20 backdrop-blur-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded-xl transition-all duration-200",
                viewMode === 'grid' 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "text-muted-foreground hover:bg-whiteAlpha.100 hover:text-foreground"
              )}
              title="Grid View"
            >
              <LayoutGrid className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 rounded-xl transition-all duration-200",
                viewMode === 'list' 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "text-muted-foreground hover:bg-whiteAlpha.100 hover:text-foreground"
              )}
              title="List View"
            >
              <List className="w-4.5 h-4.5" />
            </button>
          </div>
          <Button
            variant="gradient"
            className="h-11 shrink-0 gap-2 rounded-2xl bg-primary px-6 font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90"
            onClick={() => setShowCreate(!showCreate)}
          >
            <Plus className="w-5 h-5" />
            New Folder
          </Button>
        </div>
      </div>

      {/* Main Grid — Dynamic Response */}
      <div className={cn(
        "grid flex-1 min-h-0 items-start gap-8 overflow-hidden transition-all duration-500",
        selectedFolder ? "grid-cols-1 lg:grid-cols-[minmax(18rem,1fr)_minmax(0,2.2fr)]" : "grid-cols-1"
      )}>
        
        {/* Folder List — Small & Neat */}
        <div className={cn(
          "self-start space-y-3 overflow-y-auto max-h-full pr-1 custom-scrollbar transition-all duration-500",
          !selectedFolder && "w-full"
        )}>

          {loading ? (
            <div className={cn(
              "grid gap-3",
              viewMode === 'grid' 
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-1" 
                : "grid-cols-1"
            )}>
              {[1, 2, 3, 4, 5, 6].map(i => <FolderCardSkeleton key={i} mode={viewMode} />)}
            </div>
          ) : filteredFolders.length > 0 ? (
            <div className={cn(
              'transition-all duration-500',
              viewMode === 'list' 
                ? 'space-y-2' 
                : cn(
                    'grid gap-3.5',
                    selectedFolder ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5'
                  )
            )}>

              {filteredFolders.map((folder) => (
                <Card
                  key={folder.id}
                  role="button"
                  tabIndex={0}
                  className={cn(
                    'cursor-pointer group backdrop-blur-none bg-card/60 hover:bg-card hover:border-primary/40 hover:shadow-xl transition-all duration-300 border-border/30',
                    viewMode === 'list' ? 'rounded-2xl' : 'rounded-3xl',
                    (selectedFolder?.id === folder.id || String(selectedFolderId) === String(folder.id)) && 'border-primary/50 bg-primary/10 ring-1 ring-primary/20'
                  )}
                  onClick={() => activateFolder(folder)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      void activateFolder(folder);
                    }
                  }}
                >
                  {viewMode === 'grid' ? (
                    <CardContent className="p-7">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-5 min-w-0">
                          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                            <FolderOpen className="w-7 h-7 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-lg truncate text-foreground/90">{folder.name}</h3>
                            {folder.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-1 font-medium italic">
                                {folder.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-4">
                              <Badge variant="outline" className="h-6 gap-1.5 px-2.5 text-[10px] font-black border-border/40 text-muted-foreground uppercase tracking-wider">
                                <FileText className="w-3 h-3" />
                                {folder.file_count}
                              </Badge>
                              <Badge variant="outline" className="h-6 gap-1.5 px-2.5 text-[10px] font-black border-border/40 text-muted-foreground uppercase tracking-wider">
                                <Network className="w-3 h-3" />
                                {folder.node_count}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingFolder(folder); setShowEdit(true); }}
                            className="p-2 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-whiteAlpha.200 text-muted-foreground hover:text-primary transition-all duration-200"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeletePromptFolder(folder); }}
                            className="p-2 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-all duration-200"
                          >
                            {deleting === folder.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  ) : (
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-all duration-300">
                            <FolderOpen className="w-6 h-6 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="font-bold text-base truncate text-foreground/90">{folder.name}</h3>
                              <div className="flex items-center gap-2 shrink-0">
                                <Badge variant="outline" className="h-5 gap-1 px-1.5 text-[10px] font-bold border-border/30 text-muted-foreground/70">
                                  <FileText className="w-3 h-3" />
                                  {folder.file_count}
                                </Badge>
                                <Badge variant="outline" className="h-5 gap-1 px-1.5 text-[10px] font-bold border-border/30 text-muted-foreground/70">
                                  <Network className="w-3 h-3" />
                                  {folder.node_count}
                                </Badge>
                              </div>
                            </div>
                            {folder.description && (
                              <p className="text-[12px] text-muted-foreground truncate font-medium italic mt-0.5">
                                {folder.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 pr-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingFolder(folder); setShowEdit(true); }}
                            className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
                            title="Edit Folder"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeletePromptFolder(folder); }}
                            className="p-2 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all duration-200"
                            title="Delete Folder"
                          >
                            {deleting === folder.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                          {viewMode === 'list' && (
                            <div className={cn(
                              "ml-1 h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground transition-all duration-300",
                              (selectedFolder?.id === folder.id || String(selectedFolderId) === String(folder.id))
                                ? "bg-primary text-white scale-100"
                                : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                            )}>
                              <ChevronRight className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <Card className="min-h-[300px] flex items-center justify-center rounded-3xl border-dashed border-2">
              <CardContent className="text-center space-y-4 py-12">
                <FolderOpen className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                <h2 className="text-lg font-bold">No workspaces found</h2>
                <Button variant="outline" className="gap-2 rounded-2xl" onClick={() => setShowCreate(true)}>
                  Create your first folder
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Folder Detail Area */}
        {selectedFolder && (
          <div className="h-full min-h-0 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
            <Card variant="branded" className="flex h-full min-h-0 flex-col overflow-hidden backdrop-blur-none bg-card/60 border-border/20 shadow-2xl">
              <div className="border-b border-border/20 px-6 py-5 bg-whiteAlpha.50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 min-w-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-10 w-10 p-0 rounded-2xl bg-whiteAlpha.100 hover:bg-primary/20 hover:text-primary transition-colors"
                      onClick={resetFolderSelection}
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="min-w-0">
                      <h2 className="text-xl font-black tracking-tight truncate">{selectedFolder.name}</h2>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="h-4 text-[9px] font-bold border-primary/20 text-primary/80 uppercase">Active Collection</Badge>
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{selectedFolder.description || "Botanical Database"}</span>
                      </div>
                    </div>
                  </div>
                  <IconButton 
                    icon={<X size={18} />} 
                    variant="ghost" 
                    className="rounded-2xl text-muted-foreground hover:text-red-500 hover:bg-red-500/10" 
                    onClick={resetFolderSelection} 
                  />
                </div>
              </div>

              <CardContent className="flex flex-1 min-h-0 flex-col gap-6 p-6 overflow-y-auto custom-scrollbar">
                {/* Stats Section */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Files', value: selectedFolder.file_count, icon: FileText, color: 'text-primary' },
                    { label: 'Total Nodes', value: selectedFolder.node_count, icon: Network, color: 'text-primary' },
                    { label: 'Last Sync', value: formatDate(selectedFolder.updated_at), icon: Calendar, color: 'text-muted-foreground', isDate: true }
                  ].map((stat, i) => (
                    <div key={i} className="bg-whiteAlpha.100 rounded-3xl p-4 border border-border/10 hover:border-primary/20 transition-all group">
                      <stat.icon className={cn("w-5 h-5 mb-3 transition-transform group-hover:scale-110", stat.color)} />
                      <p className="text-xl font-black leading-none">
                        {stat.isDate ? stat.value : <AnimatedNumber value={stat.value} />}
                      </p>
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mt-2">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Tabs & Content Area */}
                <div className="space-y-5">
                  <div className="flex bg-blackAlpha.200 p-1.5 rounded-2xl w-max border border-border/10">
                    {[
                      { id: 'nodes', label: 'Knowledge Nodes' },
                      { id: 'files', label: 'Source Files' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setSelectedFolderTab(tab.id)}
                        className={cn(
                          'rounded-xl px-5 py-2 text-[12px] font-bold transition-all duration-300',
                          selectedFolderTab === tab.id
                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                            : 'text-muted-foreground hover:text-foreground hover:bg-whiteAlpha.100'
                        )}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="relative min-h-[400px]">
                     <Suspense fallback={<Flex align="center" justify="center" h="200px"><Loader2 className="animate-spin text-primary" /></Flex>}>
                        {selectedFolderTab === 'nodes' ? (
                          <FolderNodesPanel
                            active={true}
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
                        ) : (
                          <FolderFilesPanel
                            active={true}
                            folderContentSearch={folderContentSearch}
                            setFolderContentSearch={setFolderContentSearch}
                            filesLoading={filesLoading}
                            filteredFolderFiles={filteredFolderFiles}
                          />
                        )}
                     </Suspense>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <FolderCrudModal open={showEdit} mode="edit" initialFolder={editingFolder} onClose={() => setShowEdit(false)} onSuccess={() => fetchFolders()} />
    </section>
  );
}
