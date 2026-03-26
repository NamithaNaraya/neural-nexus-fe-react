import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import GraphOverviewPage from './graph/GraphOverviewPage';
import GraphForcePage from './graph/GraphForcePage';
import GraphSunburstPage from './graph/GraphSunburstPage';
import { GraphViewsNavigation } from './graph/GraphViewsNavigation';
import { folderService } from '../services/folderService';

export default function GraphPage() {
  const [folders, setFolders] = useState([]);
  const [folderId, setFolderId] = useState('');

  useEffect(() => {
    const loadFolders = async () => {
      try {
        const folderList = await folderService.list();
        setFolders(folderList || []);
        const firstId = folderList?.[0]?.id;
        if (firstId) setFolderId(firstId);
      } catch (error) {
        console.error('Failed to load folders:', error);
      }
    };
    loadFolders();
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <GraphViewsNavigation />

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Folder:</span>
          <select
            value={folderId}
            onChange={(e) => setFolderId(e.target.value)}
            className="rounded-md border border-border bg-background px-2 py-1 text-sm"
          >
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name || folder.id}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="min-h-[calc(100vh-5.5rem)]">
        <Routes>
          <Route path="" element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<GraphOverviewPage folderId={folderId} />} />
          <Route path="force" element={<GraphForcePage folderId={folderId} />} />
          <Route path="sunburst" element={<GraphSunburstPage folderId={folderId} />} />
          <Route path="treemap" element={<Navigate to="sunburst" replace />} />
          <Route path="*" element={<Navigate to="overview" replace />} />
        </Routes>
      </div>
    </div>
  );
}
