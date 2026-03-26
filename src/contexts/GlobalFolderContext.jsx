import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { folderService } from '../services/folderService';

const GlobalFolderContext = createContext(undefined);

export function GlobalFolderProvider({ children }) {
  const [folders, setFolders] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState(() => localStorage.getItem('neural_nexus_global_folder_id') || '');
  const [loading, setLoading] = useState(true);

  const refreshFolders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await folderService.list();
      const items = Array.isArray(data) ? data : [];
      setFolders(items);

      setSelectedFolderId((current) => {
        const stillExists = items.some((folder) => String(folder.id) === String(current));
        const nextId = stillExists ? current : String(items[0]?.id || '');
        if (nextId) {
          localStorage.setItem('neural_nexus_global_folder_id', nextId);
        }
        return nextId;
      });
    } catch (error) {
      console.error('Failed to load global folders:', error);
      setFolders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshFolders();
  }, [refreshFolders]);

  const updateSelectedFolderId = useCallback((folderId) => {
    setSelectedFolderId(folderId);
    if (folderId) localStorage.setItem('neural_nexus_global_folder_id', String(folderId));
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
