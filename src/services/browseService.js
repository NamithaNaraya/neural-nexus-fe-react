import api from './api';

export const browseService = {
  async getNodeTypes(folderId) {
    const url = folderId ? `/browse/types?folder_id=${encodeURIComponent(folderId)}` : '/browse/types';
    const response = await api.get(url);
    return response.data;
  },

  async getNodesByType(nodeType, folderId, page = 1, pageSize = 20, q = '') {
    const encodedType = encodeURIComponent(nodeType);
    let url = `/browse/nodes/${encodedType}?page=${page}&page_size=${pageSize}`;
    if (folderId) url += `&folder_id=${encodeURIComponent(folderId)}`;
    if (q) url += `&q=${encodeURIComponent(q)}`;
    const response = await api.get(url);
    return response.data;
  },
};
