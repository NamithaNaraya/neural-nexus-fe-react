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
};
