'use client';

import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  FileText, 
  Mic, 
  Users, 
  BarChart, 
  Crown, 
  Play, 
  CheckCircle, 
  ArrowRight,
  Sparkles,
  Download,
  MessageSquare
} from 'lucide-react';
import { useTrial } from '@/contexts/TrialContext';

interface FeatureDemoProps {
  feature: 'claude4' | 'exports' | 'voice' | 'agents' | 'analytics';
  isActive?: boolean;
  onDemo?: () => void;
}

// Individual feature demonstration components
const Claude4Demo = ({ isActive, onDemo }: { isActive?: boolean; onDemo?: () => void }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  
  const handleDemo = () => {
    setIsAnimating(true);
    onDemo?.();
    setTimeout(() => setIsAnimating(false), 2000);
  };

  return (
    <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${
      isActive ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300'
    }`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${isActive ? 'bg-blue-500' : 'bg-blue-100'}`}>
          <Brain className={`${isActive ? 'text-white' : 'text-blue-600'}`} size={20} />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Claude 4 Advanced Reasoning</h3>
          <p className="text-sm text-gray-600">Superior AI with complex problem-solving</p>
        </div>
        {isActive && <Crown className="text-yellow-500 fill-yellow-500" size={20} />}
      </div>
      
      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle className="text-green-500" size={16} />
          <span>Advanced mathematical reasoning</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle className="text-green-500" size={16} />
          <span>Complex code analysis & debugging</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle className="text-green-500" size={16} />
          <span>Multi-step logical problem solving</span>
        </div>
      </div>

      {isActive && (
        <div className="bg-white p-3 rounded-lg border border-blue-200 mb-3">
          <div className="text-xs text-blue-600 font-medium mb-1">Live Example:</div>
          <div className={`text-sm transition-opacity duration-300 ${isAnimating ? 'opacity-50' : 'opacity-100'}`}>
            <div className="bg-gray-50 p-2 rounded text-xs mb-2">
              <span className="font-medium">You:</span> "Solve this step by step: If a train leaves Chicago at 2 PM traveling 80 mph, and another leaves New York at 3 PM traveling 100 mph, when and where do they meet? The distance is 790 miles."
            </div>
            <div className="bg-blue-50 p-2 rounded text-xs">
              <span className="font-medium text-blue-700">Claude 4:</span> "I'll solve this systematically. First, let me establish the relative positions and speeds..."
              {isAnimating && <span className="animate-pulse">▋</span>}
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleDemo}
        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
          isActive 
            ? 'bg-blue-500 text-white hover:bg-blue-600' 
            : 'bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700'
        }`}
      >
        <Play size={16} className="inline mr-2" />
        {isAnimating ? 'Demonstrating...' : 'Try Claude 4 Demo'}
      </button>
    </div>
  );
};

const ExportDemo = ({ isActive, onDemo }: { isActive?: boolean; onDemo?: () => void }) => {
  const [isExporting, setIsExporting] = useState(false);
  
  const handleDemo = () => {
    setIsExporting(true);
    onDemo?.();
    setTimeout(() => setIsExporting(false), 1500);
  };

  return (
    <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${
      isActive ? 'border-purple-400 bg-purple-50' : 'border-gray-200 bg-white hover:border-purple-300'
    }`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${isActive ? 'bg-purple-500' : 'bg-purple-100'}`}>
          <FileText className={`${isActive ? 'text-white' : 'text-purple-600'}`} size={20} />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Unlimited Professional Exports</h3>
          <p className="text-sm text-gray-600">PDF & Word documents with perfect formatting</p>
        </div>
        {isActive && <Crown className="text-yellow-500 fill-yellow-500" size={20} />}
      </div>
      
      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle className="text-green-500" size={16} />
          <span>Unlimited PDF & Word exports</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle className="text-green-500" size={16} />
          <span>Professional formatting & styling</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle className="text-green-500" size={16} />
          <span>Google Drive integration</span>
        </div>
      </div>

      {isActive && (
        <div className="bg-white p-3 rounded-lg border border-purple-200 mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-purple-600 font-medium">Export Preview:</span>
            {isExporting && (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle size={12} />
                Generated
              </div>
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs p-2 bg-gray-50 rounded">
              <Download size={12} />
              <span>conversation_claude4_analysis.pdf</span>
            </div>
            <div className="flex items-center gap-2 text-xs p-2 bg-gray-50 rounded">
              <Download size={12} />
              <span>session_summary_report.docx</span>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleDemo}
        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
          isActive 
            ? 'bg-purple-500 text-white hover:bg-purple-600' 
            : 'bg-gray-100 text-gray-700 hover:bg-purple-100 hover:text-purple-700'
        }`}
      >
        <FileText size={16} className="inline mr-2" />
        {isExporting ? 'Generating...' : 'Demo Export Feature'}
      </button>
    </div>
  );
};

const VoiceDemo = ({ isActive, onDemo }: { isActive?: boolean; onDemo?: () => void }) => {
  const [isRecording, setIsRecording] = useState(false);
  
  const handleDemo = () => {
    setIsRecording(true);
    onDemo?.();
    setTimeout(() => setIsRecording(false), 3000);
  };

  return (
    <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${
      isActive ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 bg-white hover:border-emerald-300'
    }`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${isActive ? 'bg-emerald-500' : 'bg-emerald-100'}`}>
          <Mic className={`${isActive ? 'text-white' : 'text-emerald-600'}`} size={20} />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Premium Voice Recognition</h3>
          <p className="text-sm text-gray-600">Crystal-clear audio with unlimited minutes</p>
        </div>
        {isActive && <Crown className="text-yellow-500 fill-yellow-500" size={20} />}
      </div>
      
      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle className="text-green-500" size={16} />
          <span>Unlimited voice minutes</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle className="text-green-500" size={16} />
          <span>Advanced noise cancellation</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle className="text-green-500" size={16} />
          <span>Real-time quality metrics</span>
        </div>
      </div>

      {isActive && (
        <div className="bg-white p-3 rounded-lg border border-emerald-200 mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-emerald-600 font-medium">Voice Quality:</span>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <div 
                  key={i}
                  className={`h-2 w-1 rounded ${
                    isRecording 
                      ? 'bg-emerald-500 animate-pulse' 
                      : 'bg-emerald-300'
                  }`}
                  style={{ 
                    animationDelay: `${i * 100}ms`,
                    height: isRecording ? `${8 + Math.random() * 8}px` : '8px'
                  }}
                />
              ))}
            </div>
          </div>
          <div className="text-xs text-gray-600">
            {isRecording ? (
              <span className="text-emerald-600 font-medium">🎙️ Recording with premium quality...</span>
            ) : (
              <span>Premium audio processing with 99.8% accuracy</span>
            )}
          </div>
        </div>
      )}

      <button
        onClick={handleDemo}
        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
          isActive 
            ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
            : 'bg-gray-100 text-gray-700 hover:bg-emerald-100 hover:text-emerald-700'
        }`}
      >
        <Mic size={16} className="inline mr-2" />
        {isRecording ? 'Recording...' : 'Try Voice Demo'}
      </button>
    </div>
  );
};

// Main TrialShowcase component
interface TrialShowcaseProps {
  activeFeature?: string;
  showProgress?: boolean;
  compact?: boolean;
}

export default function TrialShowcase({ 
  activeFeature, 
  showProgress = true, 
  compact = false 
}: TrialShowcaseProps) {
  const { trialStatus, trackFeatureUsage } = useTrial();
  const [currentDemo, setCurrentDemo] = useState<string | null>(activeFeature || null);
  const [demoProgress, setDemoProgress] = useState(0);

  const features = [
    { id: 'claude4', component: Claude4Demo },
    { id: 'exports', component: ExportDemo },
    { id: 'voice', component: VoiceDemo }
  ];

  const handleFeatureDemo = (featureId: string) => {
    setCurrentDemo(featureId);
    setDemoProgress(prev => prev + 1);
    trackFeatureUsage(`demo_${featureId}`, 'high');
  };

  if (!trialStatus?.isTrialActive) {
    return null;
  }

  if (compact) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-200">
        <div className="flex items-center gap-3 mb-3">
          <Sparkles className="text-blue-500" size={20} />
          <div>
            <h3 className="font-semibold text-blue-900">Trial Features Active</h3>
            <p className="text-sm text-blue-700">{trialStatus.trialDaysRemaining} days remaining</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1 text-xs bg-white px-2 py-1 rounded">
            <Brain size={12} className="text-blue-500" />
            <span>Claude 4</span>
          </div>
          <div className="flex items-center gap-1 text-xs bg-white px-2 py-1 rounded">
            <FileText size={12} className="text-purple-500" />
            <span>Unlimited Exports</span>
          </div>
          <div className="flex items-center gap-1 text-xs bg-white px-2 py-1 rounded">
            <Mic size={12} className="text-emerald-500" />
            <span>Premium Voice</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Crown className="text-yellow-500 fill-yellow-500" size={24} />
          <h2 className="text-2xl font-bold text-gray-900">Premium Trial Features</h2>
          <Crown className="text-yellow-500 fill-yellow-500" size={24} />
        </div>
        <p className="text-gray-600">Experience the full power of professional AI tools</p>
        
        {showProgress && (
          <div className="mt-4 bg-gray-100 rounded-full h-2 max-w-md mx-auto">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((demoProgress / 3) * 100, 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* Feature Demos Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        {features.map(({ id, component: Component }) => (
          <Component
            key={id}
            isActive={currentDemo === id}
            onDemo={() => handleFeatureDemo(id)}
          />
        ))}
      </div>

      {/* Call to Action */}
      {demoProgress >= 2 && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-xl text-white text-center">
          <h3 className="text-xl font-bold mb-2">Ready to Keep These Features?</h3>
          <p className="mb-4 opacity-90">
            Don't lose access to Claude 4, unlimited exports, and premium voice features when your trial ends
          </p>
          <button className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
            Upgrade to Pro - $19/month
            <ArrowRight className="inline ml-2" size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

// Individual showcase components for specific features
export const Claude4Showcase = () => <Claude4Demo isActive />;
export const ExportShowcase = () => <ExportDemo isActive />;
export const VoiceShowcase = () => <VoiceDemo isActive />;

// Compact version for headers/navigation
export const TrialBadge = () => <TrialShowcase compact />;