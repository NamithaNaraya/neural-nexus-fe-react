import api from './api';
import { clearCache, readCache, writeCache } from '../utils/cache';

const CACHE_KEYS = {
  stats: 'nnv2:dashboard:stats',
  activity: 'nnv2:dashboard:activity',
  health: 'nnv2:dashboard:health',
  nodeTypes: 'nnv2:dashboard:node-types',
  folders: 'nnv2:dashboard:folders',
  connected: 'nnv2:dashboard:connected',
  uploads: 'nnv2:dashboard:uploads',
  growth: 'nnv2:dashboard:growth',
};

const TTL = {
  stats: 10 * 60 * 1000,
  activity: 2 * 60 * 1000,
  health: 30 * 1000,
  nodeTypes: 10 * 60 * 1000,
  folders: 5 * 60 * 1000,
  connected: 5 * 60 * 1000,
  uploads: 5 * 60 * 1000,
  growth: 10 * 60 * 1000,
};

async function withCache({ key, ttl, fetcher, force = false }) {
  if (!force) {
    const cached = readCache(key);
    if (cached !== null && cached !== undefined) return cached;
  }

  const data = await fetcher();
  writeCache(key, data, ttl);
  return data;
}

export const dashboardService = {
  async getStats({ force = false } = {}) {
    try {
      return await withCache({
        key: CACHE_KEYS.stats,
        ttl: TTL.stats,
        force,
        fetcher: async () => {
          const response = await api.get('/dashboard/stats');
          return response.data;
        },
      });
    } catch {
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

        const stats = [
          { label: 'Total Nodes', value: totalNodes },
          { label: 'Relationships', value: totalLinks },
          { label: 'Folders', value: folders.length },
          { label: 'Files', value: totalFiles },
        ];
        writeCache(CACHE_KEYS.stats, stats, TTL.stats);
        return stats;
      } catch {
        return [];
      }
    }
  },

  async getRecentActivity(limit = 5, { force = false } = {}) {
    try {
      return await withCache({
        key: `${CACHE_KEYS.activity}:${limit}`,
        ttl: TTL.activity,
        force,
        fetcher: async () => {
          const response = await api.get(`/dashboard/activity?limit=${limit}`);
          return response.data;
        },
      });
    } catch {
      return [];
    }
  },

  async getHealthStatus({ force = false } = {}) {
    try {
      return await withCache({
        key: CACHE_KEYS.health,
        ttl: TTL.health,
        force,
        fetcher: async () => {
          const response = await api.get('/health/detailed');
          return response.data;
        },
      });
    } catch {
      try {
        return await withCache({
          key: CACHE_KEYS.health,
          ttl: TTL.health,
          force,
          fetcher: async () => {
            const response = await api.get('/health');
            return response.data;
          },
        });
      } catch {
        return { status: 'unknown', services: {} };
      }
    }
  },

  async getNodeTypeDistribution(folderId = null, { force = false } = {}) {
    try {
      const cacheKey = folderId ? `${CACHE_KEYS.nodeTypes}:${folderId}` : CACHE_KEYS.nodeTypes;
      return await withCache({
        key: cacheKey,
        ttl: TTL.nodeTypes,
        force,
        fetcher: async () => {
          const params = new URLSearchParams();
          if (folderId) params.append('folder_id', folderId);
          const url = `/browse/types${params.toString() ? `?${params}` : ''}`;
          const response = await api.get(url);
          return response.data?.types || [];
        },
      });
    } catch (error) {
      console.error('Failed to fetch node type distribution:', error);
      return [];
    }
  },

  async getFolderStatsWithDetails({ force = false } = {}) {
    try {
      return await withCache({
        key: CACHE_KEYS.folders,
        ttl: TTL.folders,
        force,
        fetcher: async () => {
          const response = await api.get('/folders');
          return response.data || [];
        },
      });
    } catch (error) {
      console.error('Failed to fetch folder stats:', error);
      return [];
    }
  },

  async getMostConnectedNodes(folderId = null, limit = 5, { force = false } = {}) {
    try {
      const cacheKey = folderId ? `${CACHE_KEYS.connected}:${folderId}:${limit}` : `${CACHE_KEYS.connected}:global:${limit}`;
      return await withCache({
        key: cacheKey,
        ttl: TTL.connected,
        force,
        fetcher: async () => {
          const url = folderId
            ? `/graph/folder/${folderId}?min_connections=1&limit=${limit}`
            : `/graph/all?limit=${limit}`;

          const response = await api.get(url);
          const nodes = response.data?.nodes || [];

          return nodes
            .map((n) => ({
              id: n.id,
              name: n.properties?.name || n.name || n.id,
              type: n.label || n.type || 'Unknown',
              connections: n.connections_count || Object.keys(n.properties?.connections || {}).length || 0,
            }))
            .filter((n) => n.connections > 0)
            .sort((a, b) => b.connections - a.connections)
            .slice(0, limit);
        },
      });
    } catch (error) {
      console.error('Failed to fetch most connected nodes:', error);
      return [];
    }
  },

  async getRecentUploads(limit = 5, { force = false } = {}) {
    try {
      return await withCache({
        key: `${CACHE_KEYS.uploads}:${limit}`,
        ttl: TTL.uploads,
        force,
        fetcher: async () => {
          const response = await api.get('/files');
          const files = response.data || [];

          return files
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, limit)
            .map((f) => ({
              id: f.id,
              filename: f.filename,
              nodeCount: f.node_count || 0,
              relationshipCount: f.relationship_count || 0,
              createdAt: new Date(f.created_at),
              status: f.status || 'completed',
              folderId: f.folder_id,
            }));
        },
      });
    } catch (error) {
      console.error('Failed to fetch recent uploads:', error);
      return [];
    }
  },

  async getKBGrowth({ force = false } = {}) {
    try {
      return await withCache({
        key: CACHE_KEYS.growth,
        ttl: TTL.growth,
        force,
        fetcher: async () => {
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
        },
      });
    } catch (error) {
      console.error('Failed to fetch KB growth:', error);
      return { totalNodes: 0, totalRelationships: 0, nodeTypes: [], folders: 0 };
    }
  },

  clearDashboardCache() {
    Object.values(CACHE_KEYS).forEach((key) => clearCache(key));
  },
};
