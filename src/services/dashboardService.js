import api from './api';

export const dashboardService = {
  // Fetch dashboard stats — tries the dashboard endpoint first, 
  // then falls back to constructing from folder/graph data
  async getStats() {
    try {
      const response = await api.get('/dashboard/stats');
      return response.data;
    } catch {
      // Fallback: build stats from folders + graph counts
      try {
        const [foldersRes, graphRes] = await Promise.allSettled([
          api.get('/folders'),
          api.get('/graph/all?limit=1'),
        ]);

        const folders = foldersRes.status === 'fulfilled' ? foldersRes.value.data : [];
        const graph = graphRes.status === 'fulfilled' ? graphRes.value.data : {};

        const totalFiles = folders.reduce((sum, f) => sum + (f.file_count || 0), 0);
        const totalNodes = graph.total_nodes ?? folders.reduce((sum, f) => sum + (f.node_count || 0), 0);
        const totalLinks = graph.total_links ?? 0;

        return [
          { label: 'Total Nodes', value: totalNodes },
          { label: 'Relationships', value: totalLinks },
          { label: 'Folders', value: folders.length },
          { label: 'Files', value: totalFiles },
        ];
      } catch {
        return [];
      }
    }
  },

  async getRecentActivity(limit = 5) {
    try {
      const response = await api.get(`/dashboard/activity?limit=${limit}`);
      return response.data;
    } catch {
      return [];
    }
  },

  async getHealthStatus() {
    try {
      const response = await api.get('/health/detailed');
      return response.data;
    } catch {
      // Try basic health
      try {
        const response = await api.get('/health');
        return response.data;
      } catch {
        return { status: 'unknown', services: {} };
      }
    }
  },

  /**
   * Get node type distribution (DYNAMIC - from actual knowledge graph)
   */
  async getNodeTypeDistribution(folderId = null) {
    try {
      const params = new URLSearchParams();
      if (folderId) params.append('folder_id', folderId);
      const url = `/browse/types${params.toString() ? '?' + params : ''}`;
      const response = await api.get(url);
      return response.data?.types || [];
    } catch (error) {
      console.error('Failed to fetch node type distribution:', error);
      return [];
    }
  },

  /**
   * Get folder statistics (DYNAMIC - current state)
   */
  async getFolderStatsWithDetails() {
    try {
      const response = await api.get('/folders');
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch folder stats:', error);
      return [];
    }
  },

  /**
   * Get most connected nodes in a folder (DYNAMIC)
   */
  async getMostConnectedNodes(folderId = null, limit = 5) {
    try {
      // Get the graph data with min_connections filter
      const url = folderId 
        ? `/graph/folder/${folderId}?min_connections=1&limit=${limit}`
        : `/graph/all?limit=${limit}`;
      
      const response = await api.get(url);
      const nodes = response.data?.nodes || [];
      
      // Sort by number of connections (degree centrality)
      const sorted = nodes
        .map(n => ({
          id: n.id,
          name: n.properties?.name || n.name || n.id,
          type: n.label || n.type || 'Unknown',
          connections: n.connections_count || Object.keys(n.properties?.connections || {}).length || 0,
        }))
        .filter(n => n.connections > 0)
        .sort((a, b) => b.connections - a.connections)
        .slice(0, limit);
      
      return sorted;
    } catch (error) {
      console.error('Failed to fetch most connected nodes:', error);
      return [];
    }
  },

  /**
   * Get recent uploaded files (DYNAMIC - actual files from database)
   */
  async getRecentUploads(limit = 5) {
    try {
      const response = await api.get('/files');
      const files = response.data || [];
      
      // Sort by created_at descending and limit
      return files
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, limit)
        .map(f => ({
          id: f.id,
          filename: f.filename,
          nodeCount: f.node_count || 0,
          relationshipCount: f.relationship_count || 0,
          createdAt: new Date(f.created_at),
          status: f.status || 'completed',
          folderId: f.folder_id,
        }));
    } catch (error) {
      console.error('Failed to fetch recent uploads:', error);
      return [];
    }
  },

  /**
   * Get knowledge graph growth snapshot (DYNAMIC)
   */
  async getKBGrowth() {
    try {
      const [folders, nodeTypes] = await Promise.all([
        api.get('/folders'),
        api.get('/browse/types'),
      ]);

      const folderList = folders.data || [];
      const types = nodeTypes.data?.types || [];

      const totalNodes = types.reduce((sum, t) => sum + (t.count || 0), 0);
      const totalRelationships = folderList.reduce((sum, f) => sum + (f.relationship_count || 0), 0);

      return {
        totalNodes,
        totalRelationships,
        nodeTypes: types,
        folders: folderList.length,
      };
    } catch (error) {
      console.error('Failed to fetch KB growth:', error);
      return { totalNodes: 0, totalRelationships: 0, nodeTypes: [], folders: 0 };
    }
  },
};
