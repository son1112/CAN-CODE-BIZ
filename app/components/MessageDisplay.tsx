'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '@/types';
import { User, Bot, Mic } from 'lucide-react';

interface MessageDisplayProps {
  message: Message;
  isStreaming?: boolean;
}

export default function MessageDisplay({ message, isStreaming = false }: MessageDisplayProps) {
  const isUser = message.role === 'user';
  const isVoice = message.audioMetadata;

  return (
    <div className={`relative px-2 sm:px-4 py-4 sm:py-6 ${isUser ? 'bg-white' : 'bg-gradient-to-br from-slate-50 to-slate-100/50'}`}>
      <div className="w-full max-w-full sm:max-w-4xl mx-auto overflow-hidden">
        <div className={`flex gap-2 sm:gap-3 lg:gap-4 ${isUser ? 'justify-start' : 'justify-start'}`}>
          {/* Avatar - Mobile optimized with smaller size */}
          <div className="flex flex-shrink-0">
            {isUser ? (
              <div className="relative">
                <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md">
                  <User className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-white" />
                </div>
                {isVoice && (
                  <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <Mic className="w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 text-white" />
                  </div>
                )}
              </div>
            ) : (
              <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md">
                <Bot className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-white" />
              </div>
            )}
          </div>

          {/* Message Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
              <span className={`font-semibold text-sm ${isUser ? 'text-blue-700' : 'text-purple-700'}`}>
                {isUser ? 'You' : 'Claude'}
              </span>
              {isVoice && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  <Mic className="w-3 h-3" />
                  Voice
                </div>
              )}
              {isStreaming && !isUser && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                  Thinking...
                </div>
              )}
            </div>

            {/* Message Bubble */}
            <div className={`relative ${
              isUser
                ? 'bg-white border border-blue-200 rounded-2xl rounded-tl-md shadow-sm'
                : 'bg-gradient-to-br from-white to-purple-50/30 border border-purple-200/50 rounded-2xl rounded-tl-md shadow-sm'
            } p-3 sm:p-4 ${isStreaming && !isUser ? 'min-h-[3rem]' : ''} max-w-full overflow-hidden`}>

              {/* Message Text */}
              <div className={`prose prose-sm max-w-none break-words overflow-wrap-anywhere ${
                isUser
                  ? 'prose-blue text-gray-800'
                  : 'prose-purple text-gray-700'
              }`} style={{ wordBreak: 'break-word', overflowWrap: 'break-word', hyphens: 'auto' }}>
                {isUser ? (
                  <p className="mb-0 leading-relaxed">{message.content}</p>
                ) : (
                  <div className="claude-response">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({children}) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
                        ul: ({children}) => <ul className="mb-3 last:mb-0 space-y-1">{children}</ul>,
                        ol: ({children}) => <ol className="mb-3 last:mb-0 space-y-1">{children}</ol>,
                        li: ({children}) => <li className="leading-relaxed">{children}</li>,
                        h1: ({children}) => <h1 className="text-lg font-semibold mb-3 text-purple-800">{children}</h1>,
                        h2: ({children}) => <h2 className="text-base font-semibold mb-2 text-purple-700">{children}</h2>,
                        h3: ({children}) => <h3 className="text-sm font-semibold mb-2 text-purple-600">{children}</h3>,
                        code: ({children, className}) => {
                          const isInline = !className;
                          return isInline ? (
                            <code className="px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-mono">{children}</code>
                          ) : (
                            <code className={className}>{children}</code>
                          );
                        },
                        pre: ({children}) => (
                          <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg text-xs overflow-x-auto mb-3">{children}</pre>
                        ),
                        blockquote: ({children}) => (
                          <blockquote className="border-l-3 border-purple-300 pl-4 italic text-purple-700 mb-3">{children}</blockquote>
                        )
                      }}
                    >
                      {message.content || (isStreaming ? '' : '')}
                    </ReactMarkdown>

                    {/* Streaming indicator */}
                    {isStreaming && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Message tail */}
              <div className={`absolute top-4 -left-2 w-4 h-4 transform rotate-45 ${
                isUser
                  ? 'bg-white border-l border-b border-blue-200'
                  : 'bg-gradient-to-br from-white to-purple-50/30 border-l border-b border-purple-200/50'
              }`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}