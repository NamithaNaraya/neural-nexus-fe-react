import { startTransition, useDeferredValue, useEffect, useState } from 'react';
import { browseService } from '../../services/browseService';
import { folderService } from '../../services/folderService';
import { graphService } from '../../services/graphService';
import { PAGE_SIZE } from './constants';
import { groupNodesByType, sortNodes } from './helpers';

export function useBrowseExplorer() {
  const [folders, setFolders] = useState([]);
  const [nodeTypes, setNodeTypes] = useState([]);
  const [folderId, setFolderId] = useState('all');
  const [activeType, setActiveType] = useState('all');
  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState('gallery');
  const [sortMode, setSortMode] = useState('name-asc');
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    let ignore = false;

    async function loadFolders() {
      try {
        const data = await folderService.list();
        if (!ignore) setFolders(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load folders:', err);
      }
    }

    loadFolders();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadNodeTypes() {
      try {
        const scopeFolderId = folderId === 'all' ? undefined : folderId;
        const response = await browseService.getNodeTypes(scopeFolderId);
        const types = Array.isArray(response?.types) ? response.types : [];

        if (!ignore) {
          setNodeTypes(types);
          setActiveType((current) => {
            if (current === 'all') return current;
            return types.some((item) => item.type === current) ? current : 'all';
          });
        }
      } catch (err) {
        console.error('Failed to load node types:', err);
        if (!ignore) {
          setNodeTypes([]);
          setActiveType('all');
        }
      }
    }

    loadNodeTypes();
    return () => {
      ignore = true;
    };
  }, [folderId]);

  useEffect(() => {
    setPage(1);
  }, [folderId, activeType, deferredQuery]);

  useEffect(() => {
    let ignore = false;
    const searchTerm = deferredQuery.trim();
    const timer = setTimeout(() => {
      async function loadNodes() {
        setLoading(true);
        setError('');

        try {
          const scopeFolderId = folderId === 'all' ? undefined : folderId;

          if (activeType === 'all') {
            const response = scopeFolderId
              ? await graphService.getFolder(scopeFolderId, 600)
              : await graphService.getAll(600);

            const rawNodes = Array.isArray(response?.nodes) ? response.nodes : [];
            const filtered = searchTerm
              ? rawNodes.filter((node) => JSON.stringify(node).toLowerCase().includes(searchTerm.toLowerCase()))
              : rawNodes;

            const sorted = sortNodes(filtered, sortMode);
            const computedTotalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
            const safePage = Math.min(page, computedTotalPages);
            const startIndex = (safePage - 1) * PAGE_SIZE;
            const pageNodes = sorted.slice(startIndex, startIndex + PAGE_SIZE);

            if (!ignore) {
              startTransition(() => {
                setNodes(pageNodes);
                setTotalPages(computedTotalPages);
                if (safePage !== page) setPage(safePage);
              });
            }
          } else {
            const response = await browseService.getNodesByType(activeType, scopeFolderId, page, PAGE_SIZE, searchTerm);
            const rawNodes = Array.isArray(response?.nodes) ? response.nodes : [];
            const sorted = sortNodes(rawNodes, sortMode);

            if (!ignore) {
              startTransition(() => {
                setNodes(sorted);
                setTotalPages(Math.max(1, response?.total_pages || 1));
              });
            }
          }
        } catch (err) {
          console.error('Failed to load browse data:', err);
          if (!ignore) {
            setNodes([]);
            setTotalPages(1);
            setError('Browse data could not be loaded right now.');
          }
        } finally {
          if (!ignore) setLoading(false);
        }
      }

      loadNodes();
    }, 250);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [folderId, activeType, page, deferredQuery, sortMode]);

  const currentFolder = folders.find((folder) => String(folder.id) === String(folderId));
  const selectedTypeMeta = nodeTypes.find((item) => item.type === activeType);
  const totalKnownNodes = nodeTypes.reduce((sum, item) => sum + Number(item.count || 0), 0);
  const groupedNodes = groupNodesByType(nodes);

  return {
    folders,
    nodeTypes,
    folderId,
    setFolderId,
    activeType,
    setActiveType,
    query,
    setQuery,
    viewMode,
    setViewMode,
    sortMode,
    setSortMode,
    nodes,
    loading,
    error,
    page,
    setPage,
    totalPages,
    currentFolder,
    selectedTypeMeta,
    totalKnownNodes,
    groupedNodes,
  };
}
