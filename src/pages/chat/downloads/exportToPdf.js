import { jsPDF } from 'jspdf';
import { toast } from 'react-hot-toast';

/**
 * Export chat messages to a PDF file (.pdf).
 * Adapted from the Next.js UnifiedChatPanel implementation for premium look.
 */
export const exportToPdf = ({ messages, folderName, sessionTitle }) => {
  if (!messages || messages.length === 0) return;

  try {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

const accentColor = [25, 119, 65];
    const dateStr = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // Helper: add new page if needed
    const checkPage = (needed) => {
      if (y + needed > pageHeight - margin) {
        doc.addPage();
        y = margin;
        return true;
      }
      return false;
    };

    // ── Header ──
    doc.setFillColor(...accentColor);
    doc.rect(0, 0, pageWidth, 28, 'F');
    
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('Neural Nexus', margin, 12);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Research Session Export', margin, 19);
    
    doc.setFontSize(9);
    const dateWidth = doc.getTextWidth(dateStr);
    doc.text(dateStr, pageWidth - margin - dateWidth, 19);
    
    if (folderName) {
      doc.text(`Folder: ${folderName}`, margin, 25);
    }
    y = 38;

    // ── Messages ──
    messages.forEach((msg, index) => {
      if (msg.isWelcome && index === 0 && messages.length > 1) return;

      const isUser = msg.role === 'user';
      const roleLabel = isUser ? 'You' : 'Neural Nexus';
      const ts = msg.timestamp
        ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '';

      checkPage(15);

      // Role + timestamp line
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(isUser ? 71 : accentColor[0], isUser ? 85 : accentColor[1], isUser ? 105 : accentColor[2]);
      doc.text(`${roleLabel}${ts ? '  •  ' + ts : ''}`, margin, y);
      y += 5;

      // Message Content
      const cleanContent = (msg.content || '')
        .replace(/\*\*/g, '')
        .replace(/#{1,3}\s/g, '');
      
      doc.setFontSize(10);
      const textLines = doc.splitTextToSize(cleanContent, contentWidth - 8);
      const blockHeight = textLines.length * 4.5 + 6;

      checkPage(blockHeight + 5);

      // Bubble background
      if (isUser) {
        doc.setFillColor(241, 245, 249);
      } else {
        doc.setFillColor(accentColor[0], accentColor[1], accentColor[2], 0.06);
        // Fallback for older jspdf versions that don't support opacity in setFillColor
        doc.setFillColor(240, 253, 244); 
      }
      doc.roundedRect(margin, y - 2, contentWidth, blockHeight, 2, 2, 'F');

      // Text
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      let textY = y + 3;
      textLines.forEach((line) => {
        if (checkPage(5)) {
          textY = y + 3;
          // Re-draw bubble background for current line if page break happened mid-bubble
          // This is a simplification; for complex bubbles splitting is better, but this works for now.
          doc.setFillColor(isUser ? 241 : 240, isUser ? 245 : 253, isUser ? 249 : 244);
          doc.roundedRect(margin, y - 2, contentWidth, 10, 2, 2, 'F');
        }
        doc.text(line, margin + 4, textY);
        textY += 4.5;
      });
      y = textY + 4;

      if (msg.webSearchAnswer) {
        checkPage(15);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...accentColor);
        doc.text('Web Insights:', margin + 4, y);
        y += 4;
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        const webLines = doc.splitTextToSize(msg.webSearchAnswer, contentWidth - 12);
        webLines.forEach((line) => {
          checkPage(4);
          doc.text(line, margin + 6, y);
          y += 4;
        });
        y += 2;
      }

      y += 4; // gap between messages
    });

    // ── Footer ──
    checkPage(15);
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Neural Nexus Research • ${messages.length} messages • Exported ${dateStr}`, margin, y);

    const safeFolder = folderName ? `_${folderName.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
    doc.save(`neural-nexus_chat${safeFolder}_${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success('Chat exported as PDF!');
    
  } catch (err) {
    console.error('PDF export error:', err);
    toast.error('PDF export failed.');
    throw err; // Let the caller handle it
  }
};
