import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { folderService } from '../services/folderService';

const GlobalFolderContext = createContext(undefined);
const FOLDER_CACHE_KEY = 'neural_nexus_folder_cache_v1';

function readCachedFolders() {
  try {
    const saved = localStorage.getItem(FOLDER_CACHE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function GlobalFolderProvider({ children }) {
  const [folders, setFolders] = useState(() => readCachedFolders());
  const [selectedFolderId, setSelectedFolderId] = useState(() => localStorage.getItem('neural_nexus_global_folder_id') || '');
  const [loading, setLoading] = useState(() => readCachedFolders().length === 0);

  const refreshFolders = useCallback(async ({ showLoader = folders.length === 0 } = {}) => {
    if (showLoader) {
      setLoading(true);
    }
    try {
      const data = await folderService.list();
      const items = Array.isArray(data) ? data : [];
      setFolders(items);
      localStorage.setItem(FOLDER_CACHE_KEY, JSON.stringify(items));

      setSelectedFolderId((current) => {
        if (!current) return '';
        const stillExists = items.some((folder) => String(folder.id) === String(current));
        const nextId = stillExists ? current : String(items[0]?.id || '');
        if (nextId) {
          localStorage.setItem('neural_nexus_global_folder_id', nextId);
        }
        return nextId;
      });
    } catch (error) {
      console.error('Failed to load global folders:', error);
      if (folders.length === 0) {
        setFolders([]);
      }
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }, [folders.length]);

  useEffect(() => {
    refreshFolders();
  }, [refreshFolders]);

  const updateSelectedFolderId = useCallback((folderId) => {
    setSelectedFolderId(folderId);
    if (folderId) {
      localStorage.setItem('neural_nexus_global_folder_id', String(folderId));
    } else {
      localStorage.removeItem('neural_nexus_global_folder_id');
    }
  }, []);

  const currentFolder = useMemo(
    () => folders.find((folder) => String(folder.id) === String(selectedFolderId)) || null,
    [folders, selectedFolderId]
  );

  return (
    <GlobalFolderContext.Provider
      value={{
        folders,
        selectedFolderId,
        setSelectedFolderId: updateSelectedFolderId,
        currentFolder,
        loading,
        refreshFolders,
      }}
    >
      {children}
    </GlobalFolderContext.Provider>
  );
}

export function useGlobalFolder() {
  const context = useContext(GlobalFolderContext);
  if (context === undefined) {
    throw new Error('useGlobalFolder must be used within a GlobalFolderProvider');
  }
  return context;
}
