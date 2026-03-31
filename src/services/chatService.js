import api from './api';

/**
 * Chat Service - Backend persistence for chat history
 * Handles loading and managing chat sessions from PostgreSQL
 */

export const chatService = {
  /**
   * Load all chat sessions for current user from backend
   * @returns {Promise<Array>} Array of session objects with metadata
   */
  async listSessions() {
    try {
      const response = await api.get('/query/chat/sessions');
      return response.data || [];
    } catch (error) {
      console.error('Failed to list chat sessions:', error);
      return [];
    }
  },

  /**
   * Load chat history for a specific session from backend
   * @param {string} sessionId - Session UUID
   * @param {number} limit - Max messages to retrieve (default: 10 = 5 Q&A pairs)
   * @returns {Promise<Array>} Array of message objects with role, content, timestamp
   */
  async getSessionHistory(sessionId, limit = 10) {
    try {
      const response = await api.get(`/query/chat/history/${sessionId}`, {
        params: { limit },
      });
      return response.data?.messages || [];
    } catch (error) {
      console.error(`Failed to load session history for ${sessionId}:`, error);
      return [];
    }
  },

  /**
   * Delete a chat session from backend
   * @param {string} sessionId - Session UUID
   * @returns {Promise<boolean>} Success status
   */
  async deleteSession(sessionId) {
    try {
      await api.delete(`/query/chat/session/${sessionId}`);
      return true;
    } catch (error) {
      console.error(`Failed to delete session ${sessionId}:`, error);
      return false;
    }
  },

  /**
   * Sync chat workspace with backend
   * Loads all sessions for authenticated user and reconstructs workspace
   * from backend data (PostgreSQL source of truth)
   *
   * @returns {Promise<Object>} Workspace object with sessions and currentSessionId
   */
  async syncWorkspaceFromBackend() {
    try {
      const sessions = await this.listSessions();

      if (!sessions || sessions.length === 0) {
        return null; // No data in backend, use localStorage fallback
      }

      const reconstructedSessions = await Promise.all(
        sessions.map(async (backendSession) => {
          const rawMessages = await this.getSessionHistory(backendSession.session_id, 200);
          const messages = Array.isArray(rawMessages) && rawMessages.length > 0
            ? rawMessages.map((msg) => ({
                role: msg.role || 'assistant',
                content: msg.message || '',
                citations: msg.citations || [],
                timestamp: msg.timestamp ? new Date(msg.timestamp).getTime() : Date.now(),
                ...msg,
              }))
            : [];

          return {
            id: backendSession.session_id,
            messages,
            folderId: '',
            folderName: '',
            createdAt: messages.length > 0 ? messages[0].timestamp || Date.now() : Date.now(),
            updatedAt: new Date(backendSession.last_activity).getTime() || Date.now(),
            title: backendSession.last_message?.substring(0, 42) || 'Chat Session',
          };
        })
      );

      return {
        sessions: reconstructedSessions,
        currentSessionId: reconstructedSessions[0]?.id || null,
      };
    } catch (error) {
      console.error('Failed to sync workspace from backend:', error);
      return null;
    }
  },
};

export default chatService;
