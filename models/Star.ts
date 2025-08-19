import mongoose, { Schema, Document } from 'mongoose';

export type StarableType = 
  | 'message' 
  | 'session' 
  | 'agent' 
  | 'conversation-starter'
  | 'code-snippet';

export interface StarDocument extends Document {
  // Core identification
  starId: string;
  userId: string; // Who starred it
  
  // What is starred
  itemType: StarableType;
  itemId: string; // ID of the starred item
  
  // Context (depends on item type)
  context?: {
    sessionId?: string; // For messages
    messageContent?: string; // Cached for quick display
    agentId?: string; // For agents/messages
    snippet?: string; // For code snippets
    title?: string; // Display name
    description?: string; // User notes about why they starred it
  };
  
  // Organization
  tags?: string[]; // User-defined tags for organization
  category?: string; // Auto-derived category (optional)
  
  // Timestamps
  starredAt: Date;
  lastAccessedAt: Date;
  
  // User metadata
  isPrivate: boolean; // Future: sharing starred items
  priority?: 'low' | 'medium' | 'high'; // User-defined importance
}

const StarSchema = new Schema<StarDocument>(
  {
    starId: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    
    // What is starred
    itemType: { 
      type: String, 
      enum: ['message', 'session', 'agent', 'conversation-starter', 'code-snippet'],
      required: true
    },
    itemId: { type: String, required: true },
    
    // Context object for different item types
    context: {
      sessionId: String,
      messageContent: String,
      agentId: String,
      snippet: String,
      title: String,
      description: String,
    },
    
    // Organization
    tags: [String],
    category: String,
    
    // User metadata
    isPrivate: { type: Boolean, default: true },
    priority: { 
      type: String, 
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    
    // Access tracking
    lastAccessedAt: { type: Date, default: Date.now },
    starredAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false, // We manage our own timestamps
  }
);

// Indexes for performance
StarSchema.index({ userId: 1, starredAt: -1 }); // User's stars by date
StarSchema.index({ userId: 1, itemType: 1 }); // Filter by type
StarSchema.index({ userId: 1, itemId: 1, itemType: 1 }, { unique: true }); // Prevent duplicate stars
StarSchema.index({ tags: 1 }); // Search by tags
StarSchema.index({ priority: 1 }); // Filter by priority
StarSchema.index({ category: 1 }); // Filter by category

// Auto-update lastAccessedAt on read operations
StarSchema.pre('findOne', function() {
  this.set({ lastAccessedAt: new Date() });
});

// Ensure starId is generated if not provided
StarSchema.pre('save', function(next) {
  if (!this.starId) {
    this.starId = `star_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

export default mongoose.models.Star || 
  mongoose.model<StarDocument>('Star', StarSchema);