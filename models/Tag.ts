import mongoose, { Schema, Document } from 'mongoose';

export interface ITag extends Document {
  name: string;
  color: string;
  category?: string;
  description?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
}

const TagSchema = new Schema<ITag>({
  name: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    maxlength: 30
  },
  color: {
    type: String,
    required: true,
    default: '#3B82F6', // Default blue
    match: /^#[0-9A-F]{6}$/i
  },
  category: {
    type: String,
    trim: true,
    lowercase: true,
    maxlength: 20
  },
  description: {
    type: String,
    trim: true,
    maxlength: 200
  },
  userId: {
    type: String,
    required: true
  },
  usageCount: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Compound index for user-specific tag names (prevent duplicates per user)
TagSchema.index({ userId: 1, name: 1 }, { unique: true });

// Index for efficient tag searching
TagSchema.index({ userId: 1, usageCount: -1 });
TagSchema.index({ userId: 1, category: 1 });

export default mongoose.models.Tag || mongoose.model<ITag>('Tag', TagSchema);