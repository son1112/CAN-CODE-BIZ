'use client';

import React, { useMemo } from 'react';

interface FormattedMessageProps {
  content: string;
  textSizeClass: string;
  expandedView?: boolean;
}

const FormattedMessage: React.FC<FormattedMessageProps> = ({ content, textSizeClass, expandedView = false }) => {
  // Memoize the expensive formatting operation to prevent re-processing on parent re-renders
  const formattedContent = useMemo(() => {
    // Process the content to add structure and formatting
    const formatMessage = (text: string): React.ReactElement => {
    const lines = text.split('\n');
    const elements: React.ReactElement[] = [];
    let currentListItems: React.ReactElement[] = [];
    let inCodeBlock = false;
    let codeBlockLines: string[] = [];
    let codeLanguage = '';

    const flushList = () => {
      if (currentListItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="space-y-2 mb-4 pl-4">
            {currentListItems}
          </ul>
        );
        currentListItems = [];
      }
    };

    // Process inline formatting (code, bold, italic)
    const processInlineFormatting = (text: string): React.ReactNode => {
      // First handle inline code (highest priority)
      const codeRegex = /(`[^`]+`)/g;
      const parts = text.split(codeRegex);
      
      return parts.map((part, i) => {
        // Handle inline code
        if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
          return (
            <code 
              key={i}
              className="px-2 py-1 rounded text-sm font-mono"
              style={{
                backgroundColor: expandedView ? 'var(--bg-tertiary)' : '#374151',
                color: expandedView ? 'var(--text-primary)' : '#f9fafb',
                fontFamily: 'var(--font-roboto-mono), monospace'
              }}
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        
        // Process bold and italic for non-code parts
        return processTextFormatting(part, i);
      });
    };

    const processTextFormatting = (text: string, keyPrefix: number): React.ReactNode => {
      // Handle bold text (**text**)
      const boldRegex = /(\*\*[^*]+\*\*)/g;
      const boldParts = text.split(boldRegex);
      
      return boldParts.map((boldPart, j) => {
        if (boldPart.startsWith('**') && boldPart.endsWith('**') && boldPart.length > 4) {
          const innerText = boldPart.slice(2, -2);
          // Check for italic within bold
          return (
            <strong key={`${keyPrefix}-bold-${j}`} className="font-semibold">
              {processItalicFormatting(innerText, `${keyPrefix}-bold-${j}`)}
            </strong>
          );
        }
        
        // Process italic for non-bold parts
        return processItalicFormatting(boldPart, `${keyPrefix}-${j}`);
      });
    };

    const processItalicFormatting = (text: string, keyPrefix: string): React.ReactNode => {
      // Handle italic text (*text*) - but not **text**
      const italicRegex = /(\*[^*]+\*)/g;
      const italicParts = text.split(italicRegex);
      
      return italicParts.map((italicPart, k) => {
        if (italicPart.startsWith('*') && italicPart.endsWith('*') && italicPart.length > 2 && !italicPart.startsWith('**')) {
          return (
            <em key={`${keyPrefix}-italic-${k}`} className="italic">
              {italicPart.slice(1, -1)}
            </em>
          );
        }
        
        return italicPart;
      });
    };

    const flushCodeBlock = () => {
      if (codeBlockLines.length > 0) {
        elements.push(
          <div key={`code-${elements.length}`} className="mb-4">
            <div 
              className="rounded-lg overflow-hidden border"
              style={{
                backgroundColor: expandedView ? 'var(--bg-tertiary)' : '#1f2937',
                borderColor: expandedView ? 'var(--border-primary)' : '#374151'
              }}
            >
              {codeLanguage && (
                <div 
                  className="px-4 py-2 text-xs font-medium border-b"
                  style={{
                    backgroundColor: expandedView ? 'var(--bg-quaternary)' : '#111827',
                    borderColor: expandedView ? 'var(--border-primary)' : '#374151',
                    color: expandedView ? 'var(--text-tertiary)' : '#9ca3af'
                  }}
                >
                  {codeLanguage}
                </div>
              )}
              <pre 
                className="p-4 overflow-x-auto text-sm"
                style={{
                  color: expandedView ? 'var(--text-primary)' : '#f9fafb',
                  fontFamily: 'var(--font-roboto-mono), monospace'
                }}
              >
                <code>{codeBlockLines.join('\n')}</code>
              </pre>
            </div>
          </div>
        );
        codeBlockLines = [];
        codeLanguage = '';
      }
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Handle code block markers
      if (trimmedLine.startsWith('```')) {
        if (inCodeBlock) {
          // End of code block
          inCodeBlock = false;
          flushCodeBlock();
        } else {
          // Start of code block
          flushList(); // Flush any pending list items
          inCodeBlock = true;
          // Extract language if specified (e.g., ```bash, ```javascript)
          codeLanguage = trimmedLine.slice(3).trim();
        }
        return;
      }
      
      // If we're in a code block, collect the lines
      if (inCodeBlock) {
        codeBlockLines.push(line); // Keep original line with indentation
        return;
      }
      
      // Skip empty lines (only when not in code block)
      if (!trimmedLine) {
        // Add spacing for empty lines between sections
        if (elements.length > 0) {
          elements.push(<div key={`space-${index}`} className="h-2"></div>);
        }
        return;
      }

      // Main numbered sections (1., 2., 3., etc.) including simple numbers
      const mainNumberMatch = trimmedLine.match(/^(\d+)\.?\s*(.+)$/);
      if (mainNumberMatch) {
        flushList();
        const [, number, title] = mainNumberMatch;
        
        // Check if this is a simple number without much content (like just "1", "2", "3")
        const isSimpleNumber = title.length < 5;
        
        if (isSimpleNumber) {
          // Handle short numbered items as list items
          currentListItems.push(
            <li key={`numbered-item-${index}`} className="flex items-start gap-3">
              <span className="inline-flex items-center justify-center w-6 h-6 bg-gradient-to-br from-yellow-500 to-amber-500 text-black rounded-full text-sm font-bold flex-shrink-0 shadow-sm">
                {number}
              </span>
              <span 
                className="leading-relaxed"
                style={{ color: expandedView ? 'var(--text-primary)' : '#f3f4f6' }}
              >
                {processInlineFormatting(title)}
              </span>
            </li>
          );
        } else {
          // Handle longer numbered items as section headers
          elements.push(
            <div key={`section-${index}`} className="mb-4 mt-6">
              <h3 
                className="text-lg font-bold mb-3 flex items-start gap-3"
                style={{ color: expandedView ? 'var(--accent-primary)' : '#fef3c7' }}
              >
                <span className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-yellow-500 to-amber-500 text-black rounded-full text-sm font-bold flex-shrink-0 shadow-lg">
                  {number}
                </span>
                <span className="leading-tight">{processInlineFormatting(title)}</span>
              </h3>
            </div>
          );
        }
        return;
      }

      // Sub-letters (a), b), c), etc.)
      const subLetterMatch = trimmedLine.match(/^([a-z])\)\s*(.+)$/);
      if (subLetterMatch) {
        flushList();
        const [, letter, title] = subLetterMatch;
        elements.push(
          <div key={`subletter-${index}`} className="mb-3 ml-8">
            <h4 
              className="text-base font-semibold mb-2 flex items-start gap-3"
              style={{ color: expandedView ? 'var(--accent-secondary)' : '#fcd34d' }}
            >
              <span className="inline-flex items-center justify-center w-6 h-6 bg-gradient-to-br from-yellow-400 to-amber-400 text-black rounded-full text-xs font-bold flex-shrink-0">
                {letter}
              </span>
              <span className="leading-relaxed">{title}</span>
            </h4>
          </div>
        );
        return;
      }

      // Bullet points (-, •, ●, or starting with hyphen)
      const bulletMatch = trimmedLine.match(/^[-•●*]\s*(.+)$/);
      if (bulletMatch) {
        const [, content] = bulletMatch;
        currentListItems.push(
          <li key={`bullet-${index}`} className="flex items-start gap-3">
            <span className="inline-flex items-center justify-center w-2 h-2 bg-gradient-to-r from-yellow-400 to-amber-400 rounded-full mt-2.5 flex-shrink-0"></span>
            <span 
              className="leading-relaxed"
              style={{ color: expandedView ? 'var(--text-primary)' : '#f3f4f6' }}
            >
              {processInlineFormatting(content)}
            </span>
          </li>
        );
        return;
      }

      // Special handling for lines that start with bullet-like content but with special formatting
      const specialBulletMatch = trimmedLine.match(/^([•●])\s*(.+)$/);
      if (specialBulletMatch) {
        const [, bullet, content] = specialBulletMatch;
        currentListItems.push(
          <li key={`special-bullet-${index}`} className="flex items-start gap-3">
            <span className="text-yellow-400 mt-1 flex-shrink-0 font-bold">{bullet}</span>
            <span 
              className="leading-relaxed"
              style={{ color: expandedView ? 'var(--text-primary)' : '#f3f4f6' }}
            >
              {processInlineFormatting(content)}
            </span>
          </li>
        );
        return;
      }

      // Markdown headers (##, ###, ####)
      const markdownHeaderMatch = trimmedLine.match(/^(#{2,4})\s*(.+)$/);
      if (markdownHeaderMatch) {
        flushList();
        const [, hashes, title] = markdownHeaderMatch;
        const level = hashes.length;
        
        // Choose styling based on header level
        let className: string;
        let titleSize: string;
        
        switch (level) {
          case 2:
            className = "text-xl font-bold mb-4 mt-6";
            titleSize = "text-xl";
            break;
          case 3:
            className = "text-lg font-bold mb-3 mt-5";
            titleSize = "text-lg";
            break;
          default:
            className = "text-base font-bold mb-2 mt-4";
            titleSize = "text-base";
        }
        
        elements.push(
          <div key={`md-header-${index}`} className={`${className} border-l-4 border-yellow-500 pl-4 bg-gradient-to-r from-yellow-500/10 to-transparent py-2 rounded-r-md`}>
            <h2 
              className={titleSize}
              style={{ color: expandedView ? 'var(--accent-primary)' : '#fcd34d' }}
            >
              {processInlineFormatting(title)}
            </h2>
          </div>
        );
        return;
      }

      // Headers or emphasized text (text ending with :)
      const headerMatch = trimmedLine.match(/^(.+):$/);
      if (headerMatch && trimmedLine.length < 100 && !trimmedLine.includes('##')) {
        flushList();
        const [, title] = headerMatch;
        elements.push(
          <h4 
            key={`header-${index}`} 
            className="text-base font-bold mb-2 mt-4 border-l-4 border-gradient-to-b border-yellow-500 pl-4 bg-gradient-to-r from-yellow-500/10 to-transparent py-2 rounded-r-md"
            style={{ color: expandedView ? 'var(--accent-secondary)' : '#fcd34d' }}
          >
            {processInlineFormatting(title)}
          </h4>
        );
        return;
      }

      // Markdown-style bold keywords with asterisks (like **High Interest Level**: text)
      const markdownKeywordMatch = trimmedLine.match(/^\*\*([^*]+)\*\*:\s*(.+)$/);
      if (markdownKeywordMatch) {
        flushList();
        const [, keyword, description] = markdownKeywordMatch;
        elements.push(
          <div key={`md-keyword-${index}`} className="mb-3 bg-gradient-to-r from-blue-500/5 to-transparent p-3 rounded-md border-l-2 border-blue-500/30">
            <span 
              className="font-bold"
              style={{ color: expandedView ? 'var(--accent-primary)' : '#93c5fd' }}
            >
              {keyword}:
            </span>
            <span 
              className="ml-2 leading-relaxed"
              style={{ color: expandedView ? 'var(--text-primary)' : '#f3f4f6' }}
            >
              {processInlineFormatting(description)}
            </span>
          </div>
        );
        return;
      }

      // Bold keywords at start of line (Title Case followed by colon)
      const boldKeywordMatch = trimmedLine.match(/^([A-Z][a-zA-Z\s&/-]+):\s*(.+)$/);
      if (boldKeywordMatch) {
        flushList();
        const [, keyword, description] = boldKeywordMatch;
        elements.push(
          <div key={`keyword-${index}`} className="mb-3 bg-gradient-to-r from-yellow-500/5 to-transparent p-3 rounded-md border-l-2 border-yellow-500/30">
            <span 
              className="font-bold"
              style={{ color: expandedView ? 'var(--accent-primary)' : '#fcd34d' }}
            >
              {processInlineFormatting(keyword)}:
            </span>
            <span 
              className="ml-2 leading-relaxed"
              style={{ color: expandedView ? 'var(--text-primary)' : '#f3f4f6' }}
            >
              {processInlineFormatting(description)}
            </span>
          </div>
        );
        return;
      }

      // Indented content (starts with spaces)
      if (line.startsWith('  ') || line.startsWith('\t')) {
        flushList();
        elements.push(
          <div 
            key={`indent-${index}`} 
            className="ml-8 mb-2 bg-gray-800/30 p-2 rounded border-l-2 border-gray-600"
            style={{ color: expandedView ? 'var(--text-secondary)' : '#e5e7eb' }}
          >
            {trimmedLine}
          </div>
        );
        return;
      }

      // Regular paragraph text
      flushList();
      
      const isShortLine = trimmedLine.length < 200;
      const startsWithCapital = /^[A-Z]/.test(trimmedLine);
      
      elements.push(
        <p 
          key={`para-${index}`} 
          className={`mb-3 leading-relaxed ${isShortLine && startsWithCapital ? 'font-medium' : ''}`}
          style={{ color: expandedView ? 'var(--text-primary)' : '#f3f4f6' }}
        >
          {processInlineFormatting(trimmedLine)}
        </p>
      );
    });

    // Flush any remaining list items and code blocks
    flushList();
    flushCodeBlock();

      return <div className="space-y-1">{elements}</div>;
    };
    
    return formatMessage(content);
  }, [content, expandedView]);

  return (
    <div 
      className={`${textSizeClass} leading-relaxed font-medium formatted-message`}
      style={{ 
        color: expandedView ? 'var(--text-primary)' : 'white'
      }}
    >
      {formattedContent}
    </div>
  );
};

FormattedMessage.displayName = 'FormattedMessage';

export default FormattedMessage;