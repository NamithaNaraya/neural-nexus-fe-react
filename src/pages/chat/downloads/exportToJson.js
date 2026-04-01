/**
 * Export chat messages to a JSON file (.json).
 */
import { toast } from 'react-hot-toast';

export const exportToJson = ({ messages, folderName, sessionId, activeSessionTitle }) => {
  if (!messages || messages.length === 0) return;

  const exportData = {
    metadata: {
      application: 'Neural Nexus V1',
      version: '2.0.0 (React)',
      exportedAt: new Date().toISOString(),
      folderName: folderName || 'Global',
      sessionId: sessionId || 'unknown',
      sessionTitle: activeSessionTitle || 'Chat Session',
    },
    conversation: messages.map((m) => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
      isWebSearch: m.isWebSearch,
      webSearchAnswer: m.webSearchAnswer,
      sources: m.results || m.sources || [],
    })),
  };

  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  
  const safeFolder = folderName ? `_${folderName.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
  a.download = `neural-nexus_chat${safeFolder}_${new Date().toISOString().slice(0, 10)}.json`;
  
  document.body.appendChild(a);
  a.click();
  toast.success('Chat exported as JSON!');
  
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 200);
};
