'use client';

import React from 'react';

interface FormattedMessageProps {
  content: string;
  textSizeClass: string;
  expandedView?: boolean;
}

const FormattedMessage: React.FC<FormattedMessageProps> = ({ content, textSizeClass, expandedView = false }) => {
  // Process the content to add structure and formatting
  const formatMessage = (text: string): JSX.Element => {
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];
    let currentListItems: JSX.Element[] = [];
    let listLevel = 0;

    const flushList = () => {
      if (currentListItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="space-y-2 mb-4 pl-4">
            {currentListItems}
          </ul>
        );
        currentListItems = [];
        listLevel = 0;
      }
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Skip empty lines
      if (!trimmedLine) {
        // Add spacing for empty lines between sections
        if (elements.length > 0) {
          elements.push(<div key={`space-${index}`} className="h-2"></div>);
        }
        return;
      }

      // Main numbered sections (1., 2., 3., etc.)
      const mainNumberMatch = trimmedLine.match(/^(\d+)\.\s*(.+)$/);
      if (mainNumberMatch) {
        flushList();
        const [, number, title] = mainNumberMatch;
        elements.push(
          <div key={`section-${index}`} className="mb-4 mt-6">
            <h3 
              className="text-lg font-bold mb-3 flex items-start gap-3"
              style={{ color: expandedView ? 'var(--accent-primary)' : '#fef3c7' }}
            >
              <span className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-yellow-500 to-amber-500 text-black rounded-full text-sm font-bold flex-shrink-0 shadow-lg">
                {number}
              </span>
              <span className="leading-tight">{title}</span>
            </h3>
          </div>
        );
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

      // Bullet points (-, •, or starting with hyphen)
      const bulletMatch = trimmedLine.match(/^[-•*]\s*(.+)$/);
      if (bulletMatch) {
        const [, content] = bulletMatch;
        currentListItems.push(
          <li key={`bullet-${index}`} className="flex items-start gap-3">
            <span className="inline-flex items-center justify-center w-2 h-2 bg-gradient-to-r from-yellow-400 to-amber-400 rounded-full mt-2.5 flex-shrink-0"></span>
            <span 
              className="leading-relaxed"
              style={{ color: expandedView ? 'var(--text-primary)' : '#f3f4f6' }}
            >
              {content}
            </span>
          </li>
        );
        return;
      }

      // Headers or emphasized text (text ending with :)
      const headerMatch = trimmedLine.match(/^(.+):$/);
      if (headerMatch && trimmedLine.length < 100) {
        flushList();
        const [, title] = headerMatch;
        elements.push(
          <h4 
            key={`header-${index}`} 
            className="text-base font-bold mb-2 mt-4 border-l-4 border-gradient-to-b border-yellow-500 pl-4 bg-gradient-to-r from-yellow-500/10 to-transparent py-2 rounded-r-md"
            style={{ color: expandedView ? 'var(--accent-secondary)' : '#fcd34d' }}
          >
            {title}
          </h4>
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
              {keyword}:
            </span>
            <span 
              className="ml-2 leading-relaxed"
              style={{ color: expandedView ? 'var(--text-primary)' : '#f3f4f6' }}
            >
              {description}
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
      
      // Check if this looks like a continuation of a previous section
      const prevElement = elements[elements.length - 1];
      const isShortLine = trimmedLine.length < 200;
      const startsWithCapital = /^[A-Z]/.test(trimmedLine);
      
      elements.push(
        <p 
          key={`para-${index}`} 
          className={`mb-3 leading-relaxed ${isShortLine && startsWithCapital ? 'font-medium' : ''}`}
          style={{ color: expandedView ? 'var(--text-primary)' : '#f3f4f6' }}
        >
          {trimmedLine}
        </p>
      );
    });

    // Flush any remaining list items
    flushList();

    return <div className="space-y-1">{elements}</div>;
  };

  return (
    <div 
      className={`${textSizeClass} leading-relaxed font-medium formatted-message`}
      style={{ 
        color: expandedView ? 'var(--text-primary)' : 'white'
      }}
    >
      {formatMessage(content)}
    </div>
  );
};

export default FormattedMessage;