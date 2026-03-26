import api from './api';

export const graphService = {
  // Get all graph data
  async getAll(limit) {
    const response = await api.get(`/graph/all${limit ? `?limit=${limit}` : ''}`);
    return response.data;
  },

  // Get folder graph
  async getFolder(folderId, limit) {
    const response = await api.get(`/graph/folder/${folderId}${limit ? `?limit=${limit}` : ''}`);
    return response.data;
  },

  // Get file graph
  async getFile(fileId) {
    const response = await api.get(`/graph/file/${fileId}`);
    return response.data;
  },

  // Search nodes
  async search(query, limit = 20) {
    const response = await api.get(`/graph/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    return response.data;
  },

  // Get node details
  async getNodeDetails(nodeId) {
    const response = await api.get(`/graph/node/${nodeId}/details`);
    return response.data;
  },

  // Get node neighbors (expand)
  async getNodeNeighbors(nodeId) {
    const response = await api.get(`/graph/node/${nodeId}/neighbors`);
    return response.data;
  },

  // Get node types
  async getNodeTypes() {
    const response = await api.get('/graph/node-types');
    return response.data;
  },

  // Get relationship types
  async getRelationshipTypes() {
    const response = await api.get('/graph/relationship-types');
    return response.data;
  },

  // Find path between nodes
  async findPath(sourceId, targetId) {
    const response = await api.get(`/graph/path?source=${sourceId}&target=${targetId}`);
    return response.data;
  },
};
