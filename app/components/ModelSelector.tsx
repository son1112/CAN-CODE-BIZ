'use client';

import { useState } from 'react';
import { ChevronDown, Cpu, Zap, Sparkles, Info } from 'lucide-react';
import { useModel } from '@/contexts/ModelContext';
import { ClaudeModel, getCostTierColor } from '@/lib/models';

interface ModelSelectorProps {
  size?: 'sm' | 'md' | 'lg';
  showCostInfo?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function ModelSelector({ 
  size = 'md', 
  showCostInfo = true, 
  disabled = false,
  className = ''
}: ModelSelectorProps) {
  const { currentModel, availableModels, setSessionModel, getModelConfig } = useModel();
  const [isOpen, setIsOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const currentConfig = getModelConfig(currentModel);

  const handleModelSelect = (model: ClaudeModel) => {
    setSessionModel(model, 'Manual selection');
    setIsOpen(false);
  };

  const getModelIcon = (model: ClaudeModel) => {
    switch (model) {
      case 'claude-3-opus-20240229':
        return <Sparkles className="w-4 h-4" />;
      case 'claude-3-5-sonnet-20241022':
        return <Zap className="w-4 h-4" />;
      case 'claude-3-haiku-20240307':
        return <Cpu className="w-4 h-4" />;
      default:
        return <Cpu className="w-4 h-4" />;
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-2',
    lg: 'text-base px-4 py-3'
  };

  if (disabled) {
    return (
      <div className={`inline-flex items-center gap-2 opacity-50 ${sizeClasses[size]} ${className}`}>
        {getModelIcon(currentModel)}
        <span className="font-medium">{currentConfig.displayName}</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Model Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          inline-flex items-center gap-2 rounded-lg border transition-all duration-200
          hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
          ${sizeClasses[size]}
          bg-white border-gray-200 text-gray-700
        `}
        title={`Current model: ${currentConfig.displayName} - ${currentConfig.description}`}
      >
        {getModelIcon(currentModel)}
        <span className="font-medium">{currentConfig.displayName}</span>
        {showCostInfo && (
          <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${getCostTierColor(currentConfig.costTier)}`}>
            {currentConfig.costTier}
          </span>
        )}
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Info Button */}
      <button
        onClick={() => setShowInfo(!showInfo)}
        className="ml-1 p-1 rounded hover:bg-gray-100 transition-colors"
        title="Model information"
      >
        <Info className="w-3 h-3 text-gray-400" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-2 space-y-1">
            {availableModels.map((model) => {
              const isSelected = model.model === currentModel;
              return (
                <button
                  key={model.model}
                  onClick={() => handleModelSelect(model.model)}
                  className={`
                    w-full text-left p-3 rounded-lg transition-all duration-200
                    ${isSelected 
                      ? 'bg-blue-50 border-blue-200 border' 
                      : 'hover:bg-gray-50 border border-transparent'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getModelIcon(model.model)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{model.displayName}</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${getCostTierColor(model.costTier)}`}>
                          {model.costTier}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{model.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {model.bestFor.slice(0, 2).map((use) => (
                          <span
                            key={use}
                            className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                          >
                            {use}
                          </span>
                        ))}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="text-blue-500 mt-0.5">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          
          <div className="border-t border-gray-100 p-3 bg-gray-50 rounded-b-lg">
            <div className="text-xs text-gray-600">
              <p className="font-medium mb-1">Model Selection Tips:</p>
              <ul className="space-y-0.5">
                <li>• <strong>Opus:</strong> Best for complex tasks and creativity</li>
                <li>• <strong>Sonnet:</strong> Balanced performance for most tasks</li>
                <li>• <strong>Haiku:</strong> Fast and efficient for simple questions</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Model Info Modal */}
      {showInfo && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowInfo(false)}
          />
          <div className="relative flex h-full items-center justify-center p-4">
            <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  {getModelIcon(currentModel)}
                  <h3 className="text-lg font-semibold">{currentConfig.displayName}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCostTierColor(currentConfig.costTier)}`}>
                    {currentConfig.costTier} cost
                  </span>
                </div>
                
                <p className="text-gray-600 mb-4">{currentConfig.description}</p>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Strengths:</h4>
                    <div className="flex flex-wrap gap-1">
                      {currentConfig.strengths.map((strength) => (
                        <span
                          key={strength}
                          className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm"
                        >
                          {strength}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Best For:</h4>
                    <div className="flex flex-wrap gap-1">
                      {currentConfig.bestFor.map((use) => (
                        <span
                          key={use}
                          className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm"
                        >
                          {use}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowInfo(false)}
                  className="mt-4 w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}