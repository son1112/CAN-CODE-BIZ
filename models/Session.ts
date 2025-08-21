import mongoose, { Schema, Document } from 'mongoose';

export interface SessionMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  tags?: string[]; // Message-level tags
  audioMetadata?: {
    duration?: number;
    language?: string;
  };
  agentUsed?: string;
  isPinned?: boolean; // Message pinning support
  pinnedAt?: Date; // When the message was pinned
}

export interface SessionIteration {
  iteration: number;
  processedAt: Date;
  agent: string;
  transcript: string;
  agentOutputs: Record<string, string | number | boolean | object>;
  userNote: string;
  audioFileId?: string;
  metadata?: {
    processingTime?: number;
    tokenCount?: number;
    outputFormat?: string;
  };
}

export interface SessionDocument extends Document {
  // Core identification
  sessionId: string;
  name: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt: Date;
  
  // Content
  messages: SessionMessage[];
  iterations: SessionIteration[];
  
  // Metadata
  tags: string[];
  isActive: boolean;
  isArchived: boolean;
  
  // User context
  createdBy: string;
  lastAgentUsed?: string;
  primaryAgent?: string; // User-selected primary agent for session restoration
  conversationStarter?: string;
  isFavorite?: boolean; // Session favorites for quick access
  isTemplate?: boolean; // Session templates for reuse
  templateName?: string; // Name for template sessions
  avatar?: {
    imageUrl: string;
    prompt: string;
    generatedAt: Date;
  };
  
  // CLI compatibility
  iterationCount: number;
}

const SessionMessageSchema = new Schema({
  id: { type: String, required: true },
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  tags: [{ type: String }], // Message-level tags
  audioMetadata: {
    duration: Number,
    language: String,
  },
  agentUsed: String,
  isPinned: { type: Boolean, default: false }, // Message pinning support
  pinnedAt: { type: Date }, // When the message was pinned
});

const SessionIterationSchema = new Schema({
  iteration: { type: Number, required: true },
  processedAt: { type: Date, default: Date.now },
  agent: { type: String, required: true },
  transcript: { type: String, default: '' },
  agentOutputs: { type: Schema.Types.Mixed, default: {} },
  userNote: { type: String, default: '' },
  audioFileId: String,
  metadata: {
    processingTime: Number,
    tokenCount: Number,
    outputFormat: String,
  }
});

const SessionSchema = new Schema<SessionDocument>(
  {
    sessionId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    
    // Interactive chat data
    messages: [SessionMessageSchema],
    
    // CLI-style iterations
    iterations: [SessionIterationSchema],
    iterationCount: { type: Number, default: 0 },
    
    // Metadata
    tags: [String],
    isActive: { type: Boolean, default: true },
    isArchived: { type: Boolean, default: false },
    
    // User context
    createdBy: { type: String, required: true },
    lastAgentUsed: String,
    primaryAgent: String, // User-selected primary agent for session restoration
    conversationStarter: String,
    isFavorite: { type: Boolean, default: false }, // Session favorites for quick access
    isTemplate: { type: Boolean, default: false }, // Session templates for reuse
    templateName: String, // Name for template sessions
    avatar: {
      imageUrl: String,
      prompt: String,
      generatedAt: Date,
    },
    
    // Access tracking
    lastAccessedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true, // Auto-manages createdAt and updatedAt
  }
);

// Indexes for performance
SessionSchema.index({ createdBy: 1, createdAt: -1 });
SessionSchema.index({ createdBy: 1, lastAccessedAt: -1 });
SessionSchema.index({ name: 1, createdBy: 1 }, { unique: true });
SessionSchema.index({ tags: 1 });
SessionSchema.index({ isActive: 1, isArchived: 1 });
SessionSchema.index({ createdBy: 1, isFavorite: 1 });
SessionSchema.index({ createdBy: 1, isTemplate: 1 });

// Note: name index is covered by compound index { name: 1, createdBy: 1 }

// Auto-update lastAccessedAt on read operations
SessionSchema.pre('findOne', function() {
  this.set({ lastAccessedAt: new Date() });
});

SessionSchema.pre('find', function() {
  this.set({ lastAccessedAt: new Date() });
});

// Auto-increment iteration count when iterations are added
SessionSchema.pre('save', function() {
  if (this.isModified('iterations')) {
    this.iterationCount = this.iterations.length;
  }
});

export default mongoose.models.Session || 
  mongoose.model<SessionDocument>('Session', SessionSchema);