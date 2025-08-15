'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Mic, Square, Sparkles, Bot, CheckCircle, Type, MessageSquare } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import Logo from '@/app/components/Logo';

interface CreateAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAgentCreated: (agent: any) => void;
}

export default function CreateAgentModal({ isOpen, onClose, onAgentCreated }: CreateAgentModalProps) {
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createdAgent, setCreatedAgent] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Text input fields
  const [agentName, setAgentName] = useState('');
  const [agentPurpose, setAgentPurpose] = useState('');
  const [agentPersonality, setAgentPersonality] = useState('');
  const [agentTasks, setAgentTasks] = useState('');
  const [agentContext, setAgentContext] = useState('');
  const [outputFormat, setOutputFormat] = useState('');
  
  // Individual field recording states
  const [recordingField, setRecordingField] = useState<string | null>(null);
  const [fieldTranscripts, setFieldTranscripts] = useState<{[key: string]: string}>({});

  const {
    transcript: speechTranscript,
    startListening,
    stopListening,
    isListening,
    isSupported,
    error: speechError,
    resetTranscript
  } = useSpeechRecognition();

  // Update transcript when speech recognition provides new text
  useEffect(() => {
    if (speechTranscript) {
      if (inputMode === 'voice') {
        setTranscript(speechTranscript);
      } else if (recordingField) {
        // Update the specific field being recorded
        setFieldTranscripts(prev => ({
          ...prev,
          [recordingField]: speechTranscript
        }));
      }
    }
  }, [speechTranscript, inputMode, recordingField]);

  // Update error when speech recognition encounters an error
  useEffect(() => {
    if (speechError) {
      setError(speechError);
    }
  }, [speechError]);

  const handleStartRecording = async () => {
    setError(null);
    setTranscript('');
    resetTranscript();
    setIsRecording(true);
    try {
      await startListening();
    } catch (err) {
      setError('Failed to start recording');
      setIsRecording(false);
    }
  };

  const handleStopRecording = async () => {
    setIsRecording(false);
    setRecordingField(null);
    stopListening();
  };

  // Handle field-specific recording
  const handleStartFieldRecording = async (fieldName: string) => {
    setError(null);
    setRecordingField(fieldName);
    resetTranscript();
    try {
      await startListening();
    } catch (err) {
      setError('Failed to start recording');
      setRecordingField(null);
    }
  };

  const handleStopFieldRecording = () => {
    stopListening();
    setRecordingField(null);
  };

  const handleInsertFieldTranscript = (fieldName: string) => {
    const transcript = fieldTranscripts[fieldName];
    if (!transcript) return;

    switch (fieldName) {
      case 'agentName':
        setAgentName(prev => prev + (prev ? ' ' : '') + transcript);
        break;
      case 'agentPurpose':
        setAgentPurpose(prev => prev + (prev ? ' ' : '') + transcript);
        break;
      case 'agentPersonality':
        setAgentPersonality(prev => prev + (prev ? ' ' : '') + transcript);
        break;
      case 'agentTasks':
        setAgentTasks(prev => prev + (prev ? ' ' : '') + transcript);
        break;
      case 'agentContext':
        setAgentContext(prev => prev + (prev ? ' ' : '') + transcript);
        break;
      case 'outputFormat':
        setOutputFormat(prev => prev + (prev ? ' ' : '') + transcript);
        break;
    }

    // Clear the field transcript after inserting
    setFieldTranscripts(prev => ({
      ...prev,
      [fieldName]: ''
    }));
  };

  const handleCreateAgent = async () => {
    let description = '';
    
    if (inputMode === 'voice') {
      if (!transcript.trim()) {
        setError('Please record a description for your agent first');
        return;
      }
      description = transcript;
    } else {
      // Validate text inputs
      if (!agentPurpose.trim()) {
        setError('Please describe what your agent does');
        return;
      }
      
      // Construct a comprehensive description from text inputs
      description = `Agent Name: ${agentName || 'Custom Agent'}

Purpose: ${agentPurpose}

${agentPersonality ? `Personality & Tone: ${agentPersonality}` : ''}

${agentTasks ? `Key Tasks: ${agentTasks}` : ''}

${agentContext ? `Context & Domain: ${agentContext}` : ''}

${outputFormat ? `Output Format: ${outputFormat}` : ''}`.trim();
    }

    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          voiceDescription: description
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create agent');
      }

      const result = await response.json();
      setCreatedAgent(result.agent);
      onAgentCreated(result.agent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create agent');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (isListening) {
      handleStopRecording();
    }
    setTranscript('');
    setError(null);
    setCreatedAgent(null);
    setIsCreating(false);
    setInputMode('voice');
    setRecordingField(null);
    setFieldTranscripts({});
    // Reset text input fields
    setAgentName('');
    setAgentPurpose('');
    setAgentPersonality('');
    setAgentTasks('');
    setAgentContext('');
    setOutputFormat('');
    onClose();
  };

  // Component for field voice recorder
  const FieldVoiceRecorder = ({ fieldName, disabled }: { fieldName: string; disabled?: boolean }) => {
    const isRecordingThis = recordingField === fieldName;
    const hasTranscript = fieldTranscripts[fieldName]?.trim();

    if (!isSupported) return null;

    return (
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => {
            if (isRecordingThis) {
              handleStopFieldRecording();
            } else {
              handleStartFieldRecording(fieldName);
            }
          }}
          disabled={disabled || (recordingField && !isRecordingThis)}
          className={`p-2 rounded-lg transition-all duration-200 ${
            isRecordingThis
              ? 'bg-red-100 text-red-600 hover:bg-red-200'
              : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title={isRecordingThis ? 'Stop recording' : 'Record voice input'}
        >
          {isRecordingThis ? (
            <Square className="w-4 h-4" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
        </button>
        
        {hasTranscript && (
          <button
            type="button"
            onClick={() => handleInsertFieldTranscript(fieldName)}
            disabled={disabled}
            className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Insert recorded text"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  };

  if (!isOpen || typeof window === 'undefined') return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        style={{ zIndex: 999997 }}
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col"
        style={{ zIndex: 999998 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col h-full">
          {/* Header */}
          <div className="relative px-8 py-6 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Create New Agent</h2>
                  <p className="text-green-700 font-medium">🎙️ Describe your custom AI assistant</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 overflow-y-auto flex-1">
            {!createdAgent ? (
              <>
                {/* Input Mode Toggle */}
                <div className="mb-6 flex items-center justify-center">
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setInputMode('voice')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        inputMode === 'voice'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Mic className="w-4 h-4" />
                      Voice Recording
                    </button>
                    <button
                      onClick={() => setInputMode('text')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        inputMode === 'text'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Type className="w-4 h-4" />
                      Text Input
                    </button>
                  </div>
                </div>

                {/* Instructions */}
                <div className="mb-8 p-6 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-start gap-4">
                    <Logo size="md" variant="minimal" showText={false} />
                    <div>
                      <h3 className="font-semibold text-blue-900 mb-2">
{inputMode === 'voice' ? 'Voice Recording Guide:' : 'Agent Creation Guide:'}
                      </h3>
                      {inputMode === 'voice' ? (
                        <ul className="text-sm text-blue-800 space-y-2">
                          <li>• <strong>Describe what you want:</strong> "I want an agent that helps me with cooking recipes"</li>
                          <li>• <strong>Explain the personality:</strong> "Make it friendly and encouraging"</li>
                          <li>• <strong>Specify the tasks:</strong> "It should suggest ingredients and cooking steps"</li>
                          <li>• <strong>Add any special features:</strong> "Include dietary restrictions and prep time"</li>
                        </ul>
                      ) : (
                        <ul className="text-sm text-blue-800 space-y-2">
                          <li>• <strong>Purpose:</strong> Core function and primary use case</li>
                          <li>• <strong>Personality:</strong> Communication style and tone</li>
                          <li>• <strong>Tasks:</strong> Specific actions the agent performs</li>
                          <li>• <strong>Context:</strong> Domain knowledge and specializations</li>
                          <li>• <strong>Output:</strong> How responses should be formatted</li>
                        </ul>
                      )}
                    </div>
                  </div>
                </div>

                {/* Input Section */}
                <div className="space-y-6">
                  {inputMode === 'voice' ? (
                    /* Voice Recording Interface */
                    <>
                      {/* Recording Button */}
                      <div className="text-center">
                        {!isSupported ? (
                          <div className="text-red-600 text-sm">
                            Speech recognition is not supported in your browser
                          </div>
                        ) : (
                          <button
                            onClick={isListening ? handleStopRecording : handleStartRecording}
                            disabled={isCreating}
                            className={`relative px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg ${
                              isListening
                                ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-red-500/25 hover:shadow-red-500/30'
                                : 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-green-500/25 hover:shadow-green-500/30'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {isListening ? (
                                <>
                                  <Square className="w-6 h-6" />
                                  Stop Recording
                                </>
                              ) : (
                                <>
                                  <Mic className="w-6 h-6" />
                                  Start Recording
                                </>
                              )}
                            </div>
                            
                            {isListening && (
                              <div className="absolute inset-0 bg-gradient-to-r from-red-400/30 to-transparent rounded-2xl animate-pulse"></div>
                            )}
                          </button>
                        )}
                      </div>

                      {/* Transcript Display */}
                      {transcript && (
                        <div className="space-y-4">
                          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <h4 className="font-semibold text-gray-900 mb-2">Your Description:</h4>
                            <p className="text-gray-700 leading-relaxed">{transcript}</p>
                          </div>
                          
                          <div className="flex gap-3">
                            <button
                              onClick={() => setTranscript('')}
                              className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                              Clear
                            </button>
                            <button
                              onClick={handleCreateAgent}
                              disabled={isCreating || !transcript.trim()}
                              className="flex-1 px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold"
                            >
                              {isCreating ? (
                                <div className="flex items-center justify-center gap-2">
                                  <Sparkles className="w-4 h-4 animate-spin" />
                                  Creating Agent...
                                </div>
                              ) : (
                                'Create Agent'
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    /* Text Input Interface */
                    <div className="space-y-6">
                      {/* Agent Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Agent Name <span className="text-gray-400">(optional)</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={agentName}
                            onChange={(e) => setAgentName(e.target.value)}
                            placeholder="e.g., Recipe Helper, Code Reviewer, Writing Assistant"
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <FieldVoiceRecorder fieldName="agentName" disabled={isCreating} />
                        </div>
                        {fieldTranscripts.agentName && (
                          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                            <strong>Recorded:</strong> "{fieldTranscripts.agentName}"
                          </div>
                        )}
                      </div>

                      {/* Agent Purpose */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          What does this agent do? <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-start gap-2">
                          <textarea
                            value={agentPurpose}
                            onChange={(e) => setAgentPurpose(e.target.value)}
                            placeholder="Describe the main purpose and core functionality of your agent..."
                            rows={3}
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          />
                          <div className="pt-1">
                            <FieldVoiceRecorder fieldName="agentPurpose" disabled={isCreating} />
                          </div>
                        </div>
                        {fieldTranscripts.agentPurpose && (
                          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                            <strong>Recorded:</strong> "{fieldTranscripts.agentPurpose}"
                          </div>
                        )}
                      </div>

                      {/* Agent Personality */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Personality & Communication Style <span className="text-gray-400">(optional)</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={agentPersonality}
                            onChange={(e) => setAgentPersonality(e.target.value)}
                            placeholder="e.g., friendly and encouraging, professional and concise, creative and enthusiastic"
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <FieldVoiceRecorder fieldName="agentPersonality" disabled={isCreating} />
                        </div>
                        {fieldTranscripts.agentPersonality && (
                          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                            <strong>Recorded:</strong> "{fieldTranscripts.agentPersonality}"
                          </div>
                        )}
                      </div>

                      {/* Specific Tasks */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Specific Tasks & Capabilities <span className="text-gray-400">(optional)</span>
                        </label>
                        <div className="flex items-start gap-2">
                          <textarea
                            value={agentTasks}
                            onChange={(e) => setAgentTasks(e.target.value)}
                            placeholder="List specific tasks, actions, or capabilities this agent should have..."
                            rows={3}
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          />
                          <div className="pt-1">
                            <FieldVoiceRecorder fieldName="agentTasks" disabled={isCreating} />
                          </div>
                        </div>
                        {fieldTranscripts.agentTasks && (
                          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                            <strong>Recorded:</strong> "{fieldTranscripts.agentTasks}"
                          </div>
                        )}
                      </div>

                      {/* Context & Domain */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Context & Domain Knowledge <span className="text-gray-400">(optional)</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={agentContext}
                            onChange={(e) => setAgentContext(e.target.value)}
                            placeholder="e.g., software development, cooking, business analysis, creative writing"
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <FieldVoiceRecorder fieldName="agentContext" disabled={isCreating} />
                        </div>
                        {fieldTranscripts.agentContext && (
                          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                            <strong>Recorded:</strong> "{fieldTranscripts.agentContext}"
                          </div>
                        )}
                      </div>

                      {/* Output Format */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Preferred Output Format <span className="text-gray-400">(optional)</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={outputFormat}
                            onChange={(e) => setOutputFormat(e.target.value)}
                            placeholder="e.g., step-by-step lists, bullet points, detailed explanations, code examples"
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <FieldVoiceRecorder fieldName="outputFormat" disabled={isCreating} />
                        </div>
                        {fieldTranscripts.outputFormat && (
                          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                            <strong>Recorded:</strong> "{fieldTranscripts.outputFormat}"
                          </div>
                        )}
                      </div>

                      {/* Create Button */}
                      <div className="pt-4">
                        <button
                          onClick={handleCreateAgent}
                          disabled={isCreating || !agentPurpose.trim()}
                          className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold"
                        >
                          {isCreating ? (
                            <div className="flex items-center justify-center gap-2">
                              <Sparkles className="w-4 h-4 animate-spin" />
                              Creating Agent...
                            </div>
                          ) : (
                            'Create Agent'
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Error Display */}
                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                      <p className="text-red-700 text-sm">{error}</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Success State */
              <div className="text-center space-y-6">
                <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Agent Created Successfully!</h3>
                  <p className="text-gray-600">Your new AI agent "<strong>{createdAgent.name}</strong>" is ready to use.</p>
                </div>
                
                <div className="p-6 bg-gray-50 rounded-xl border border-gray-200 text-left">
                  <h4 className="font-semibold text-gray-900 mb-2">Agent Details:</h4>
                  <p className="text-sm text-gray-700 mb-2"><strong>Name:</strong> {createdAgent.name}</p>
                  <p className="text-sm text-gray-700"><strong>Description:</strong> {createdAgent.description}</p>
                </div>
                
                <button
                  onClick={handleClose}
                  className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105"
                >
                  Start Using Agent
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}