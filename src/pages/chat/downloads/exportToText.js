/**
 * Export chat messages to a plain text file (.txt).
 * Follows the styling and structure of the Neural Nexus V1 Next.js implementation.
 */
import { toast } from 'react-hot-toast';

export const exportToText = ({ messages, folderName, chatMode = 'research' }) => {
  if (!messages || messages.length === 0) return;

  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  let output = '';
  output += '═'.repeat(60) + '\n';
  output += '  NEURAL NEXUS - RESEARCH EXPORT\n';
  output += `  Date: ${dateStr}\n`;
  output += `  Folder: ${folderName || 'Global'}\n`;
  output += '═'.repeat(60) + '\n\n';

  messages.forEach((msg, index) => {
    // Skip welcome message if there is other content
    if (msg.isWelcome && index === 0 && messages.length > 1) return;

    const roleLabel = msg.role === 'user' ? 'YOU' : 'NEURAL NEXUS';
    const timestamp = msg.timestamp 
      ? new Date(msg.timestamp).toLocaleTimeString() 
      : new Date().toLocaleTimeString();

    output += `[${roleLabel}]  (${timestamp})\n`;
    output += '─'.repeat(40) + '\n';
    output += `${msg.content || ''}\n`;

    if (msg.webSearchAnswer) {
      output += '\n[WEB INSIGHTS]\n';
      output += `${msg.webSearchAnswer}\n`;
    }

    if (msg.results && msg.results.length > 0) {
      output += '\n[CITATIONS]\n';
      msg.results.forEach((res, i) => {
        output += `  ${i + 1}. ${res.name || res.node_name || 'Source node'}\n`;
      });
    }

    output += '\n' + '.'.repeat(60) + '\n\n';
  });

  output += '═'.repeat(60) + '\n';
  output += '  End of Export\n';
  output += '═'.repeat(60) + '\n';

  const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeFolder = folderName ? `_${folderName.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
  a.download = `neural-nexus_chat${safeFolder}_${new Date().toISOString().slice(0, 10)}.txt`;
  
  document.body.appendChild(a);
  a.click();
  toast.success('Chat exported as text!');
  
  // Cleanup
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 200);
};
