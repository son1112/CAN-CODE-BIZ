'use client';

import { useState } from 'react';
import { ChevronDown, Bot, User, Sparkles, Zap } from 'lucide-react';
import { useAgent } from '@/contexts/AgentContext';
import { AVAILABLE_AGENTS } from '@/lib/agents';
import { useAgents } from '@/hooks/useAgents';

export default function AgentSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const { currentAgent, setAgent } = useAgent();
  const { agents: cliAgents, loading: cliLoading, error: cliError } = useAgents();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <Bot className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-medium">{currentAgent.name}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto">
            <div className="p-2">
              {/* Basic Agents Section */}
              <div className="mb-4">
                <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                  <Bot className="w-3 h-3" />
                  Basic Agents
                </div>
                <div className="space-y-1">
                  {AVAILABLE_AGENTS.map((agent) => (
                    <button
                      key={agent.id}
                      onClick={() => {
                        setAgent(agent.id);
                        setIsOpen(false);
                      }}
                      className={`
                        w-full text-left p-3 rounded-md hover:bg-gray-50 transition-colors
                        ${currentAgent.id === agent.id ? 'bg-blue-50 border border-blue-200' : ''}
                      `}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                          ${currentAgent.id === agent.id ? 'bg-blue-100' : 'bg-gray-100'}
                        `}>
                          {agent.id === 'real-estate-advisor' ? (
                            <User className="w-4 h-4 text-gray-600" />
                          ) : (
                            <Bot className="w-4 h-4 text-gray-600" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 text-sm">
                            {agent.name}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {agent.description}
                          </div>
                          
                          {agent.keyTopics && agent.keyTopics.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {agent.keyTopics.slice(0, 3).map((topic) => (
                                <span
                                  key={topic}
                                  className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
                                >
                                  {topic}
                                </span>
                              ))}
                              {agent.keyTopics.length > 3 && (
                                <span className="px-2 py-1 text-xs text-gray-500">
                                  +{agent.keyTopics.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* CLI Power Agents Section */}
              {!cliLoading && cliAgents.length > 0 && (
                <div className="border-t border-gray-100 pt-4">
                  <div className="px-2 py-1 text-xs font-semibold text-purple-600 uppercase tracking-wide flex items-center gap-2">
                    <Sparkles className="w-3 h-3" />
                    Power Agents ({cliAgents.length})
                  </div>
                  <div className="space-y-1">
                    {cliAgents.map((agent) => (
                      <button
                        key={`cli-${agent.name}`}
                        onClick={() => {
                          // For now, we'll just log this - we need to extend the context to handle CLI agents
                          console.log('Selected CLI agent:', agent);
                          setIsOpen(false);
                        }}
                        className="w-full text-left p-3 rounded-md hover:bg-purple-50 transition-colors border border-transparent hover:border-purple-200"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-purple-500 to-pink-500">
                            <Zap className="w-4 h-4 text-white" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 text-sm flex items-center gap-2">
                              {agent.name}
                              <span className="px-1.5 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full font-medium">
                                POWER
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1 line-clamp-3">
                              {agent.description.length > 150 
                                ? agent.description.substring(0, 150) + '...' 
                                : agent.description}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Loading state for CLI agents */}
              {cliLoading && (
                <div className="border-t border-gray-100 pt-4">
                  <div className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-2">
                    <Sparkles className="w-3 h-3 animate-spin" />
                    Loading Power Agents...
                  </div>
                </div>
              )}

              {/* Error state for CLI agents */}
              {cliError && !cliLoading && (
                <div className="border-t border-gray-100 pt-4">
                  <div className="px-3 py-2 text-xs text-red-600 bg-red-50 rounded-md">
                    Power agents unavailable: {cliError}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}