import api from './api';

/**
 * Chat Service - Backend persistence for chat history
 * Handles loading and managing chat sessions from PostgreSQL
 */

export const chatService = {
  /**
   * Load all chat sessions for current user from backend (V2 Optimized)
   * @returns {Promise<Array>} Array of session objects with metadata
   */
  async listSessions() {
    try {
      // Use the newly created V2-specific metadata API
      const response = await api.get('/query/chat/v2/sessions');
      return response.data || [];
    } catch (error) {
      console.error('Failed to list chat sessions:', error);
      return [];
    }
  },

  /**
   * Load chat history for a specific session from backend
   * @param {string} sessionId - Session UUID
   * @param {number} limit - Max messages to retrieve (default: 200 for full context)
   * @returns {Promise<Array>} Array of message objects
   */
  async getSessionHistory(sessionId, limit = 200) {
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
   * as metadata-only shells (Lazy Loading).
   *
   * @returns {Promise<Object>} Workspace object with sessions and currentSessionId
   */
  async syncWorkspaceFromBackend() {
    try {
      const sessions = await this.listSessions();

      if (!sessions || sessions.length === 0) {
        return null;
      }

      // Strictly metadata-only shells. Messages stay empty until the session is selected.
      const reconstructedSessions = sessions
        .filter((s) => s && s.session_id)
        .map((backendSession) => {
          const lastActivity = backendSession.last_activity ? new Date(backendSession.last_activity).getTime() : Date.now();
          return {
            id: backendSession.session_id,
            messages: [], // LAZY LOADED on selection
            folderId: '',
            folderName: '',
            createdAt: lastActivity,
            updatedAt: lastActivity,
            title: backendSession.last_message?.substring(0, 42) || 'New Chat',
          };
        });

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
