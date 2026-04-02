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

const isTableDivider = (line) => /^\s*\|?(?:\s*:?-{3,}:?\s*\|)+\s*:?-{3,}:?\s*\|?\s*$/.test(line);

const looksLikeTableRow = (line) => /\|/.test(line);

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
        <a key={`${keyPrefix}-${match.index}`} href={match[3]} target="_blank" rel="noopener noreferrer" className="text-emerald-700 dark:text-emerald-300 hover:underline font-medium">
          {match[2]}
          <ExternalLink className="ml-1 inline-block h-3 w-3" />
        </a>
      );
    } else if (match[5]) {
      pieces.push(
        <strong key={`${keyPrefix}-${match.index}`} className="font-semibold text-stone-900 dark:text-stone-100">
          {match[5]}
        </strong>
      );
    } else if (match[7]) {
      pieces.push(
        <code
          key={`${keyPrefix}-${match.index}`}
          className="rounded-md border border-stone-200 bg-stone-100 px-1.5 py-0.5 font-mono text-[0.85em] text-stone-800 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200"
        >
          {match[7]}
        </code>
      );
    } else if (match[9]) {
      pieces.push(
        <em key={`${keyPrefix}-${match.index}`} className="italic text-stone-900 dark:text-stone-100">
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
        <pre key={`code-${index}`} className="my-3 overflow-x-auto rounded-xl border border-stone-200 bg-stone-100 p-3 text-sm text-stone-800 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-200">
          {language && <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">{language}</div>}
          <code className="whitespace-pre-wrap font-mono">{codeLines.join('\n')}</code>
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
          className={`mt-4 mb-2 font-bold tracking-tight border-l-3 pl-3 ${
            level === 1 ? 'text-xl border-emerald-500' : level === 2 ? 'text-lg border-emerald-400' : 'text-base border-emerald-300 dark:border-emerald-700'
          } text-stone-900 dark:text-stone-100`}
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
        <div key={`table-${index}`} className="my-4 overflow-x-auto rounded-xl border border-stone-200/80 shadow-sm dark:border-stone-700/60">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-emerald-50/80 dark:bg-emerald-950/30">
              <tr>
                {header.map((cell, cellIndex) => (
                  <th key={cellIndex} className="border-b border-stone-200 px-4 py-2.5 font-semibold text-stone-800 dark:border-stone-700 dark:text-stone-100">
                    {renderInlineMarkdown(cell, `table-header-${index}-${cellIndex}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rowLines.map((row, rowIndex) => (
                <tr key={rowIndex} className={cn('border-b border-stone-100 last:border-b-0 dark:border-stone-800', rowIndex % 2 === 1 && 'bg-stone-50/50 dark:bg-stone-900/30')}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-2 align-top text-stone-700 dark:text-stone-200">
                      {renderInlineMarkdown(cell, `table-row-${index}-${rowIndex}-${cellIndex}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
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
        <ul key={`ul-${index}`} className="my-3 list-disc space-y-2 pl-5 text-stone-700 dark:text-stone-200">
          {items.map((item, itemIndex) => (
            <li key={itemIndex} className="pl-1 leading-relaxed">
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
        <ol key={`ol-${index}`} className="my-3 list-decimal space-y-2 pl-5 text-stone-700 dark:text-stone-200">
          {items.map((item, itemIndex) => (
            <li key={itemIndex} className="pl-1 leading-relaxed">
              {renderInlineMarkdown(item, `ol-${index}-${itemIndex}`)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    if (/^>\s+/.test(trimmed)) {
      blocks.push(
        <blockquote key={`quote-${index}`} className="my-3 border-l-4 border-emerald-300 bg-emerald-50/70 pl-4 pr-3 py-2 text-stone-700 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-stone-200">
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
      <p key={`p-${index}`} className="mb-3 last:mb-0 leading-[1.75] text-stone-800 dark:text-stone-100">
        {renderInlineMarkdown(paragraphLines.join(' '), `p-${index}`)}
      </p>
    );
  }

  return blocks;
};

const AnimatedDots = ({ tone = 'neutral' }) => {
  const dotClassName =
    tone === 'amber'
      ? 'bg-amber-500 dark:bg-amber-400'
      : 'bg-gray-400 dark:bg-gray-500';

  return (
    <span className="inline-flex items-center gap-1 align-middle">
      <span className={cn('h-2 w-2 rounded-full animate-bounce', dotClassName)} />
      <span className={cn('h-2 w-2 rounded-full animate-bounce', dotClassName)} style={{ animationDelay: '0.1s' }} />
      <span className={cn('h-2 w-2 rounded-full animate-bounce', dotClassName)} style={{ animationDelay: '0.2s' }} />
    </span>
  );
};

export const MessageBubble = React.memo(function MessageBubble({ message, onWebSearch, messageIndex }) {
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
    <div className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}>
      {isUser ? (
        <div className="w-8 h-8 rounded-lg bg-slate-500 flex items-center justify-center shrink-0 shadow-sm">
          <User className="w-4 h-4 text-white" />
        </div>
      ) : (
        <div className={cn('w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0 shadow-sm', message.isStreaming && 'animate-pulse')}>
          {isStandaloneWebSearch ? <Globe className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
        </div>
      )}

      <div className={cn(
        'rounded-2xl px-4 py-3 text-sm leading-relaxed transition-all duration-300 hover:shadow-md',
        isUser ? 'max-w-[85%]' : 'max-w-[90%]',
        isUser
          ? 'rounded-br-md border border-emerald-200/80 bg-emerald-100 text-emerald-950 shadow-sm shadow-emerald-500/10 dark:border-emerald-800/70 dark:bg-emerald-900/35 dark:text-emerald-50'
          : isError
            ? 'bg-red-50 border border-red-200 text-red-900 rounded-bl-md dark:bg-red-900/20 dark:border-red-800 dark:text-red-100'
            : isStandaloneWebSearch
              ? 'rounded-bl-md border border-amber-200 bg-amber-50 text-stone-900 shadow-sm shadow-amber-500/10 dark:border-amber-800/70 dark:bg-amber-950/25 dark:text-amber-50'
              : 'bg-white/80 border border-gray-200 text-gray-900 rounded-bl-md dark:bg-gray-800/80 dark:border-gray-700 dark:text-gray-100 backdrop-blur-sm'
      )}>
        <div className={cn(
          'prose prose-sm max-w-none break-words whitespace-normal w-full',
          isUser ? 'prose-stone dark:prose-invert' : 'dark:prose-invert'
        )}>
          {hasAssistantText ? renderMarkdownContent(cleanedContent) : null}
          {message.isStreaming && !hasAssistantText && (
            <AnimatedDots />
          )}
          {message.isStreaming && hasAssistantText && (
            <span className="inline-block w-2 h-4 ml-0.5 bg-emerald-500 dark:bg-emerald-400 rounded-sm animate-pulse align-text-bottom" />
          )}
        </div>

        {!isUser && !isError && !isWelcome && !message.isStreaming && onWebSearch && !message.webSearchAnswer && message.content && (
          <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700/50">
            <button
              onClick={() => onWebSearch({
                question: message.webSearchQuery || message.content,
                contextHint: message.content,
                messageIndex,
              })}
              disabled={webSearchPending}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors text-xs font-medium disabled:opacity-60',
                webSearchPending
                  ? 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-300'
              )}
            >
              {webSearchPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Globe className="w-3 h-3" />}
              {webSearchPending ? 'Searching...' : 'Search Web'}
            </button>
          </div>
        )}

        {(message.webSearchAnswer || message.isStreamingWebSearch) && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/80 p-3 dark:border-amber-800/60 dark:bg-amber-950/20">
            <div className="mb-3 flex items-center gap-2 text-amber-700 dark:text-amber-300">
                <Globe className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">Web Answer</span>
            </div>
            <div className="prose prose-sm max-w-none break-words whitespace-normal w-full text-stone-800 dark:prose-invert dark:text-stone-100">
              {hasWebSearchText ? renderMarkdownContent(cleanedWebSearchAnswer) : null}
              {message.isStreamingWebSearch && !hasWebSearchText && (
                <AnimatedDots tone="amber" />
              )}
              {message.isStreamingWebSearch && hasWebSearchText && (
                <span className="inline-block w-2 h-4 ml-0.5 bg-amber-500 dark:bg-amber-400 rounded-sm animate-pulse align-text-bottom" />
              )}
            </div>

            {Array.isArray(message.webSearchSources) && message.webSearchSources.length > 0 && (
              <div className="mt-3 pt-3 border-t border-amber-200/60 dark:border-amber-800/40">
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-600 dark:text-amber-400">Sources</div>
                <div className="flex flex-wrap gap-2">
                  {message.webSearchSources.map((source, idx) => {
                    const url = source?.url || source?.uri || '';
                    const title = source?.title || source?.name || (url ? new URL(url).hostname : `Source ${idx + 1}`);
                    return url ? (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-white/80 px-2.5 py-1 text-[11px] font-medium text-amber-800 shadow-sm transition-all hover:bg-amber-100 hover:shadow-md dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-200 dark:hover:bg-amber-900/40"
                        title={title}
                      >
                        <ExternalLink className="h-3 w-3 shrink-0" />
                        <span className="max-w-[220px] truncate">{title}</span>
                      </a>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export const TypingIndicator = React.memo(function TypingIndicator() {
  return (
    <div className="flex gap-3 justify-start">
      <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="bg-white/80 border border-gray-200 rounded-2xl px-4 py-3 dark:bg-gray-800/80 dark:border-gray-700 backdrop-blur-sm">
        <AnimatedDots />
      </div>
    </div>
  );
});

