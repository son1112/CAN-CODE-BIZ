'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Bot, User, Sparkles, Zap, Plus } from 'lucide-react';
import { useAgent } from '@/contexts/AgentContext';
import { useDropdown } from '@/contexts/DropdownContext';
import { AVAILABLE_AGENTS } from '@/lib/agents';
import { useAgents } from '@/hooks/useAgents';
import Logo from '@/app/components/Logo';
import CreateAgentModal from '@/app/components/CreateAgentModal';
import StarButton from './StarButton';

export default function AgentSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreateAgentModalOpen, setIsCreateAgentModalOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLDivElement>(null);
  const { currentAgent, currentPowerAgent, setAgent, setPowerAgent, isUsingPowerAgent } = useAgent();
  const { agents: cliAgents, loading: cliLoading, error: cliError, loadAgents } = useAgents();
  const { setIsDropdownOpen } = useDropdown();

  // Get display name for current selection
  const currentDisplayName = isUsingPowerAgent 
    ? currentPowerAgent?.name 
    : currentAgent.name;

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX
      });
    }
  }, [isOpen]);

  // Auto-initialize first power agent when agents are loaded (only on first load)
  useEffect(() => {
    if (!cliLoading && cliAgents.length > 0 && !currentPowerAgent && !isUsingPowerAgent) {
      // Only auto-initialize if no basic agent selection has been made
      // Check if current agent is still the default agent
      if (currentAgent.id === 'default') {
        console.log('Auto-initializing first power agent:', cliAgents[0].name);
        setPowerAgent(cliAgents[0]);
      }
    }
  }, [cliAgents, cliLoading, currentPowerAgent, isUsingPowerAgent, setPowerAgent, currentAgent.id]);


  // Handle agent creation
  const handleAgentCreated = async (newAgent: any) => {
    // Refresh the agents list
    await loadAgents();
    // Select the new agent
    setPowerAgent(newAgent);
    // Close the modal
    setIsCreateAgentModalOpen(false);
  };

  return (
    <div className="relative no-text-scale" ref={buttonRef}>
      <button
        onClick={() => {
          const newIsOpen = !isOpen;
          setIsOpen(newIsOpen);
          setIsDropdownOpen(newIsOpen);
        }}
        className="flex items-center bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        style={{ gap: '6px', padding: '6px 10px' }}
      >
        <Bot style={{ width: '14px', height: '14px' }} className="text-blue-600" />
        <span className="font-medium text-gray-900" style={{ fontSize: '12px' }}>{currentDisplayName}</span>
        {isUsingPowerAgent && (
          <span className="bg-purple-100 text-purple-700 rounded-full font-medium" style={{ padding: '2px 6px', fontSize: '10px' }}>
            POWER
          </span>
        )}
        <ChevronDown style={{ width: '14px', height: '14px' }} className={`text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && typeof window !== 'undefined' && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0"
            style={{ zIndex: 999998 }}
            onClick={() => {
              setIsOpen(false);
              setIsDropdownOpen(false);
            }}
          />
          
          {/* Dropdown */}
          <div 
            className="fixed w-96 bg-white border border-gray-200 rounded-lg shadow-2xl max-h-80 overflow-y-auto no-text-scale"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              zIndex: 999999
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-2 relative">
              {/* Create New Agent Section - Top Priority */}
              <div className="mb-4">
                <div className="px-2 py-1 text-xs font-semibold text-green-600 uppercase tracking-wide flex items-center gap-2">
                  <Plus className="w-3 h-3" />
                  Create Agent
                </div>
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setIsCreateAgentModalOpen(true);
                      setIsOpen(false);
                      setIsDropdownOpen(false);
                    }}
                    className="w-full text-left p-3 rounded-md hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-colors border border-transparent hover:border-green-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-green-500 to-emerald-600">
                        <Plus className="w-4 h-4 text-white" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 text-sm flex items-center gap-2">
                          Create New Agent
                          <span className="px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded-full font-medium">
                            NEW
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          🎙️ Voice recording or text input to create custom AI agents
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* CLI Power Agents Section */}
              {console.log('Rendering Power Agents:', { cliLoading, agentCount: cliAgents.length, agents: cliAgents })}
              {!cliLoading && cliAgents.length > 0 && (
                <div className="border-t border-gray-100 pt-4 mb-4">
                  <div className="px-2 py-1 text-xs font-semibold text-purple-600 uppercase tracking-wide flex items-center gap-2">
                    <Sparkles className="w-3 h-3" />
                    Power Agents ({cliAgents.length})
                  </div>
                  <div className="space-y-1">
                    <div className="p-2 bg-green-100 text-green-800 text-xs">
                      ✅ Power Agents Working: {cliAgents.length} agents loaded
                    </div>
                    {cliAgents.map((agent) => (
                      <button
                        key={`cli-${agent.name}`}
                        onClick={() => {
                          console.log('Selected Power Agent:', agent.name);
                          setPowerAgent(agent);
                          setIsOpen(false);
                          setIsDropdownOpen(false);
                        }}
                        className={`
                          group w-full text-left p-3 rounded-md hover:bg-purple-50 transition-colors border border-transparent hover:border-purple-200
                          ${currentPowerAgent?.name === agent.name ? 'bg-purple-50 border-purple-200' : ''}
                        `}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-purple-500 to-pink-500">
                            <Zap className="w-4 h-4 text-white" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="font-medium text-gray-900 text-sm flex items-center gap-2">
                                {agent.name}
                                <span className="px-1.5 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full font-medium">
                                  POWER
                                </span>
                              </div>
                              <div 
                                onClick={(e) => e.stopPropagation()}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <StarButton
                                  userId="demo-user" // TODO: Replace with actual user ID from auth
                                  itemType="agent"
                                  itemId={agent.name}
                                  context={{
                                    title: agent.name,
                                    description: agent.description,
                                  }}
                                  size="sm"
                                />
                              </div>
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

              {/* Basic Agents Section - Bottom */}
              <div className="border-t border-gray-100 pt-4">
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
                        setIsDropdownOpen(false);
                      }}
                      className={`
                        group w-full text-left p-3 rounded-md hover:bg-gray-50 transition-colors
                        ${currentAgent.id === agent.id && !isUsingPowerAgent ? 'bg-blue-50 border border-blue-200' : ''}
                      `}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                          ${currentAgent.id === agent.id && !isUsingPowerAgent ? 'bg-blue-100' : 'bg-gray-100'}
                        `}>
                          {agent.id === 'real-estate-advisor' ? (
                            <User className="w-4 h-4 text-gray-600" />
                          ) : (
                            <Bot className="w-4 h-4 text-gray-600" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-gray-900 text-sm">
                              {agent.name}
                            </div>
                            <div 
                              onClick={(e) => e.stopPropagation()}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <StarButton
                                userId="demo-user" // TODO: Replace with actual user ID from auth
                                itemType="agent"
                                itemId={agent.id}
                                context={{
                                  title: agent.name,
                                  description: agent.description,
                                }}
                                size="sm"
                              />
                            </div>
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

              {/* Animated Logo in bottom-right corner */}
              <div className="absolute bottom-2 right-2 opacity-20 hover:opacity-40 transition-all duration-300 transform hover:scale-110 pointer-events-none">
                <Logo size="sm" variant="minimal" showText={false} />
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
      
      {/* Create Agent Modal */}
      <CreateAgentModal
        isOpen={isCreateAgentModalOpen}
        onClose={() => setIsCreateAgentModalOpen(false)}
        onAgentCreated={handleAgentCreated}
      />
    </div>
  );
}