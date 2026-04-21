import React from 'react';
import { cn } from '../../utils/cn';
import { Bot, Globe, ExternalLink, Loader2, User } from 'lucide-react';

const MD_INLINE_REGEX = /(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))|(\*\*([^*]+)\*\*)|(`([^`]+)`)|(\*([^*\n]+)\*)/g;

const splitTableRow = (line) =>
  line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());

const looksLikeTableRow = (line) => /\|/.test(line);

const isTableDivider = (line) => {
  const trimmed = line.trim();
  if (trimmed.length < 3 || !trimmed.includes('-')) return false;
  // A table divider must only contain | , : and - characters, and must have at least one --- sequence
  return /^[:|\-\s]+$/.test(trimmed) && trimmed.split('|').some(part => part.includes('-'));
};

const isInternalPatternLabel = (line) =>
  /^\s*(?:\*\*)?\s*pattern\s+[a-z0-9]+(?:\s*[:\-])?/i.test(String(line || '').trim());

const sanitizeAssistantAnswer = (text) => {
  const safeText = String(text || '').replace(/\r\n/g, '\n');
  const lines = safeText.split('\n');
  const cleanedLines = [];

  for (let index = 0; index < lines.length; index += 1) {
    const currentLine = lines[index];
    const trimmedLine = currentLine.trim();
    const nextLine = lines[index + 1]?.trim() || '';

    // Skip "source/search" tables (metadata tables the user doesn't need)
    if (looksLikeTableRow(trimmedLine) && isTableDivider(nextLine) && /\b(source|search)\b/i.test(trimmedLine)) {
      index += 1;
      while (index + 1 < lines.length && looksLikeTableRow(lines[index + 1].trim())) {
        index += 1;
      }
      continue;
    }

    // Skip lines referencing search methods
    if (/\b(semantic search|structural search)\b/i.test(trimmedLine)) continue;
    if (isInternalPatternLabel(trimmedLine)) continue;

    cleanedLines.push(currentLine);
  }

  // Reassemble: preserve table blocks as-is, normalize plain text paragraphs
  const result = [];
  let i = 0;
  while (i < cleanedLines.length) {
    const trimmed = cleanedLines[i].trim();

    // Detect table block: a row with | followed by a divider row
    if (looksLikeTableRow(trimmed) && i + 1 < cleanedLines.length && isTableDivider(cleanedLines[i + 1].trim())) {
      // Collect entire table block (header + divider + data rows)
      while (i < cleanedLines.length && (looksLikeTableRow(cleanedLines[i].trim()) || isTableDivider(cleanedLines[i].trim()))) {
        result.push(cleanedLines[i].trim());
        i++;
      }
      continue;
    }

    // Detect orphan table rows (data without explicit divider — still a table)
    if (looksLikeTableRow(trimmed) && trimmed.split('|').length >= 3) {
      result.push(trimmed);
      i++;
      continue;
    }

    // Empty line → preserve as paragraph break
    if (!trimmed) {
      result.push('');
      i++;
      continue;
    }

    // Regular text paragraph — collect contiguous non-table, non-empty lines
    const paragraphLines = [];
    while (i < cleanedLines.length) {
      const line = cleanedLines[i].trim();
      if (!line || looksLikeTableRow(line) || isTableDivider(line) || /^```/.test(line) || /^#{1,6}\s/.test(line) || /^[-*+]\s/.test(line) || /^\d+\.\s/.test(line) || /^>\s/.test(line)) break;
      paragraphLines.push(line);
      i++;
    }
    if (paragraphLines.length > 0) {
      result.push(paragraphLines.join(' '));
    } else if (i < cleanedLines.length) {
      // Fallback for lines that match no pattern (e.g. malformed table rows)
      result.push(cleanedLines[i].trim());
      i++;
    }
  }

  return result.join('\n').replace(/\n{3,}/g, '\n\n').trim();
};

const renderInlineMarkdown = (text, keyPrefix = 'inline') => {
  const pieces = [];
  let lastIndex = 0;
  let match;

  const safeText = String(text ?? '');
  MD_INLINE_REGEX.lastIndex = 0;
  while ((match = MD_INLINE_REGEX.exec(safeText)) !== null) {
    if (match.index > lastIndex) {
      pieces.push(safeText.slice(lastIndex, match.index));
    }

    if (match[2] && match[3]) {
      pieces.push(
        <a
          key={`${keyPrefix}-${match.index}`}
          href={match[3]}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium hover:underline text-primary"
        >
          {match[2]}
          <ExternalLink className="ml-1 inline-block h-3 w-3" />
        </a>
      );
    } else if (match[5]) {
      pieces.push(
        <strong key={`${keyPrefix}-${match.index}`} className="font-bold text-foreground">
          {match[5]}
        </strong>
      );
    } else if (match[7]) {
      pieces.push(
        <code
          key={`${keyPrefix}-${match.index}`}
          className="rounded-md border border-border/40 bg-muted/30 px-1.5 py-0.5 font-mono text-[0.85em] text-foreground"
        >
          {match[7]}
        </code>
      );
    } else if (match[9]) {
      pieces.push(
        <em key={`${keyPrefix}-${match.index}`} className="italic text-foreground/90">
          {match[9]}
        </em>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < safeText.length) {
    pieces.push(safeText.slice(lastIndex));
  }

  return pieces.length ? pieces : safeText;
};

const renderMarkdownContent = (text) => {
  const lines = String(text || '').replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (trimmed.startsWith('```')) {
      const codeLines = [];
      const language = trimmed.slice(3).trim();
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      blocks.push(
        <pre key={`code-${index}`} className="my-4 overflow-x-auto rounded-xl border border-border/30 bg-muted/20 p-4 text-xs font-medium text-foreground/90 backdrop-blur-sm">
          {language && (
            <div className="mb-3 flex items-center justify-between border-b border-border/20 pb-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/60">{language}</span>
              <div className="flex gap-1">
                <div className="h-2 w-2 rounded-full bg-border/40" />
                <div className="h-2 w-2 rounded-full bg-border/40" />
              </div>
            </div>
          )}
          <code className="block whitespace-pre font-mono leading-relaxed">{codeLines.join('\n')}</code>
        </pre>
      );
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const Tag = `h${Math.min(level, 6)}`;
      blocks.push(
        <Tag
          key={`heading-${index}`}
          className={cn(
            'mt-6 mb-3 font-bold tracking-tight',
            level === 1 ? 'text-xl text-foreground' : level === 2 ? 'text-lg text-foreground/90' : 'text-base text-foreground/80'
          )}
        >
          {renderInlineMarkdown(headingMatch[2], `heading-${index}`)}
        </Tag>
      );
      index += 1;
      continue;
    }

    if (looksLikeTableRow(trimmed) && index + 1 < lines.length && isTableDivider(lines[index + 1])) {
      const header = splitTableRow(trimmed);
      const shouldHideTable = header.some((cell) => /\b(source|search)\b/i.test(cell));
      const rowLines = [];
      index += 2;
      while (index < lines.length && looksLikeTableRow(lines[index].trim())) {
        rowLines.push(splitTableRow(lines[index]));
        index += 1;
      }

      if (shouldHideTable) {
        continue;
      }

      blocks.push(
        <div key={`table-${index}`} className="my-5 overflow-hidden rounded-xl border border-border/40 bg-card/40 shadow-sm backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-muted/30 border-b border-border/30">
                  {header.map((cell, cellIndex) => (
                    <th key={cellIndex} className="px-4 py-3 font-bold uppercase tracking-wider text-muted-foreground">
                      {renderInlineMarkdown(cell, `table-header-${index}-${cellIndex}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {rowLines.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-muted/10 transition-colors">
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-4 py-3 align-top text-foreground/90 leading-relaxed font-medium">
                        {renderInlineMarkdown(cell, `table-row-${index}-${rowIndex}-${cellIndex}`)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
      continue;
    }

    if (/^(\-|\*|\+)\s+/.test(trimmed)) {
      const items = [];
      while (index < lines.length && /^(\-|\*|\+)\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^(\-|\*|\+)\s+/, ''));
        index += 1;
      }

      blocks.push(
        <ul key={`ul-${index}`} className="my-4 list-none space-y-2.5">
          {items.map((item, itemIndex) => (
            <li key={itemIndex} className="relative pl-6 text-sm leading-relaxed text-foreground/90 font-medium">
              <span className="absolute left-0 top-[0.6em] h-1.5 w-1.5 rounded-full bg-primary/40" />
              {renderInlineMarkdown(item, `ul-${index}-${itemIndex}`)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+\.\s+/, ''));
        index += 1;
      }

      blocks.push(
        <ol key={`ol-${index}`} className="my-4 list-none space-y-2.5">
          {items.map((item, itemIndex) => (
            <li key={itemIndex} className="relative pl-7 text-sm leading-relaxed text-foreground/90 font-medium">
              <span className="absolute left-0 top-0 text-[10px] font-bold text-primary/50">{itemIndex + 1}.</span>
              {renderInlineMarkdown(item, `ol-${index}-${itemIndex}`)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    if (/^>\s+/.test(trimmed)) {
      blocks.push(
        <blockquote key={`quote-${index}`} className="my-4 border-l-3 border-accent/40 bg-accent/5 px-4 py-3 text-sm text-foreground/80 italic rounded-r-lg">
          {renderInlineMarkdown(trimmed.replace(/^>\s+/, ''), `quote-${index}`)}
        </blockquote>
      );
      index += 1;
      continue;
    }

    const paragraphLines = [trimmed];
    index += 1;
    while (index < lines.length) {
      const nextLine = lines[index].trim();
      if (!nextLine || nextLine.startsWith('```') || /^(#{1,6})\s+/.test(nextLine) || /^(\-|\*|\+)\s+/.test(nextLine) || /^\d+\.\s+/.test(nextLine) || /^>\s+/.test(nextLine) || (looksLikeTableRow(nextLine) && index + 1 < lines.length && isTableDivider(lines[index + 1]))) {
        break;
      }
      paragraphLines.push(nextLine);
      index += 1;
    }

    blocks.push(
      <p key={`p-${index}`} className="mb-4 last:mb-0 leading-[1.8] text-sm text-foreground/90 font-medium">
        {renderInlineMarkdown(paragraphLines.join(' '), `p-${index}`)}
      </p>
    );
  }

  return blocks;
};

const AnimatedDots = ({ tone = 'neutral' }) => {
  const dotClassName =
    tone === 'amber'
      ? 'bg-accent/60'
      : 'bg-muted-foreground/30';

  return (
    <span className="inline-flex items-center gap-1.5 align-middle px-1">
      <span className={cn('h-1.5 w-1.5 rounded-full animate-bounce', dotClassName)} />
      <span className={cn('h-1.5 w-1.5 rounded-full animate-bounce', dotClassName)} style={{ animationDelay: '0.15s' }} />
      <span className={cn('h-1.5 w-1.5 rounded-full animate-bounce', dotClassName)} style={{ animationDelay: '0.3s' }} />
    </span>
  );
};

function MessageBubbleComponent({ message, onWebSearch, messageIndex }) {
  const isUser = message.role === 'user';
  const isError = message.isError;
  const isWebSearch = message.isWebSearch;
  const webSearchPending = message.webSearchPending;
  const webSearchSuggested = message.webSearchSuggested;
  const isWelcome = message.isWelcome;
  const cleanedContent = !isUser ? sanitizeAssistantAnswer(message.content) || message.content : message.content;
  const cleanedWebSearchAnswer = sanitizeAssistantAnswer(message.webSearchAnswer) || message.webSearchAnswer;
  const isStandaloneWebSearch = isWebSearch && !message.content && !message.webSearchAnswer;
  const hasAssistantText = Boolean(String(cleanedContent || '').trim());
  const hasWebSearchText = Boolean(String(cleanedWebSearchAnswer || '').trim());

  return (
    <div className={cn('flex w-full items-start gap-4 py-1.5 animate-scale-in', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className={cn(
          'mt-1 h-9 w-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-primary/20 bg-primary/10 transition-all duration-500',
          message.isStreaming ? 'animate-pulse scale-105' : 'hover:scale-110'
        )}>
          {isStandaloneWebSearch ? (
            <Globe className="w-4.5 h-4.5 text-primary" />
          ) : (
            <Bot className="w-4.5 h-4.5 text-primary" />
          )}
        </div>
      )}

      <div className={cn(
        'group relative min-w-0 rounded-3xl px-5 py-4 text-sm leading-relaxed transition-all duration-300',
        isUser ? 'max-w-[min(78%,34rem)]' : 'max-w-[min(100%,56rem)]',
        isUser
          ? 'rounded-tr-none border border-primary/15 bg-primary/8 text-foreground shadow-sm hover:shadow-md'
          : isError
            ? 'bg-destructive/8 border border-destructive/20 text-destructive rounded-tl-none'
            : isStandaloneWebSearch
              ? 'rounded-tl-none border border-accent/20 bg-accent/8 text-foreground shadow-sm hover:shadow-md'
              : 'rounded-tl-none border border-border/50 bg-card/80 text-foreground shadow-sm hover:shadow-md backdrop-blur-md'
      )}>
        <div className="prose prose-sm max-w-none break-words whitespace-normal w-full overflow-hidden">
          {hasAssistantText ? (
            message.isStreaming ? (
              <p className="mb-0 whitespace-pre-wrap leading-[1.8] text-foreground font-medium">
                {cleanedContent}
                <span className="inline-block w-2 h-4 ml-1.5 bg-primary/50 rounded-sm animate-pulse align-text-bottom" />
              </p>
            ) : (
              renderMarkdownContent(cleanedContent)
            )
          ) : null}

          {message.isStreaming && !hasAssistantText && (
            <div className="flex items-center gap-2 py-1">
              <span className="text-xs font-semibold text-muted-foreground/60 tracking-wider">THINKING</span>
              <AnimatedDots />
            </div>
          )}
        </div>

        {/* Web Search Trigger Button (for manual search if suggested) */}
        {!isUser && !isError && !isWelcome && !message.isStreaming && onWebSearch && !message.webSearchAnswer && message.content && (
          <div className="mt-4 pt-4 border-t border-border/20">
            <button
              onClick={() => onWebSearch({
                question: message.webSearchQuery || message.content,
                contextHint: message.content,
                messageIndex,
              })}
              disabled={webSearchPending}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-full transition-all text-[11px] font-bold uppercase tracking-wider disabled:opacity-50 ring-1 ring-inset',
                webSearchPending
                  ? 'bg-muted/10 ring-border/20 text-muted-foreground'
                  : 'bg-accent/10 ring-accent/30 text-accent hover:bg-accent/20 hover:scale-105 active:scale-95'
              )}
            >
              {webSearchPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Globe className="w-3.5 h-3.5" />
              )}
              {webSearchPending ? 'Searching...' : 'Explore Web'}
            </button>
          </div>
        )}

        {/* Integrated Web Search Result Section */}
        {(message.webSearchAnswer || message.isStreamingWebSearch) && (
          <div className="mt-5 rounded-[1.75rem] border border-accent/25 bg-accent/5 p-5 shadow-inner backdrop-blur-sm animate-fade-up">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-accent">
                  <div className="p-1.5 rounded-lg bg-accent/15">
                    <Globe className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-[0.14em]">Connected Research</span>
              </div>
              {message.isStreamingWebSearch && <div className="h-1.5 w-1.5 rounded-full bg-accent animate-ping" />}
            </div>
            
            <div className="prose prose-sm max-w-none break-words whitespace-normal w-full overflow-hidden">
              {hasWebSearchText ? (
                message.isStreamingWebSearch ? (
                  <p className="mb-0 whitespace-pre-wrap leading-[1.8] text-foreground font-medium">
                    {cleanedWebSearchAnswer}
                    <span className="inline-block w-2 h-4 ml-1.5 bg-accent/50 rounded-sm animate-pulse align-text-bottom" />
                  </p>
                ) : (
                  renderMarkdownContent(cleanedWebSearchAnswer)
                )
              ) : null}
              {message.isStreamingWebSearch && !hasWebSearchText && (
                <div className="flex items-center gap-2 py-1">
                  <span className="text-xs font-semibold text-accent/60 tracking-wider uppercase">Searching</span>
                  <AnimatedDots tone="amber" />
                </div>
              )}
            </div>

            {Array.isArray(message.webSearchSources) && message.webSearchSources.length > 0 && (
              <div className="mt-5 pt-4 border-t border-accent/15">
                <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-accent/50">Verified Sources</div>
                <div className="flex flex-wrap gap-2.5">
                  {message.webSearchSources.map((source, idx) => {
                    const url = source?.url || source?.uri || '';
                    const title = source?.title || source?.name || (url ? new URL(url).hostname : `Source ${idx + 1}`);
                    return url ? (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group/source inline-flex items-center gap-2 rounded-xl border border-accent/20 bg-card/60 px-3.5 py-1.5 text-[11px] font-bold text-foreground transition-all hover:bg-accent hover:text-white hover:border-accent hover:shadow-lg dark:bg-card/40 dark:hover:bg-accent dark:hover:text-white"
                        title={title}
                      >
                        <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-40 group-hover/source:opacity-100 transition-opacity" />
                        <span className="max-w-[180px] truncate">{title}</span>
                      </a>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {isUser && (
        <div className="mt-1 h-9 w-9 rounded-xl bg-accent flex items-center justify-center shrink-0 border border-white/20 shadow-lg shadow-accent/20 transition-transform hover:scale-110">
          <User className="w-4.5 h-4.5 text-white" />
        </div>
      )}
    </div>
  );
}

export const MessageBubble = React.memo(
  MessageBubbleComponent,
  (prevProps, nextProps) =>
    prevProps.message === nextProps.message
    && prevProps.messageIndex === nextProps.messageIndex
);

export const TypingIndicator = React.memo(function TypingIndicator() {
  return (
    <div className="flex gap-4 justify-start animate-fade-up">
      <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 shadow-sm animate-pulse">
        <Bot className="w-4.5 h-4.5 text-primary" />
      </div>
      <div className="bg-card/80 border border-border/50 rounded-3xl rounded-tl-none px-6 py-4 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-2">
           <span className="text-[10px] font-bold text-muted-foreground/50 tracking-widest uppercase">Streaming</span>
           <AnimatedDots />
        </div>
      </div>
    </div>
  );
});
