import mongoose, { Schema, Document } from 'mongoose';
import { Conversation as IConversation } from '@/types';

export interface ConversationDocument extends Omit<IConversation, '_id'>, Document {}

const MessageSchema = new Schema({
  id: { type: String, required: true },
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  tags: [{ type: String }], // Message-level tags
  audioMetadata: {
    duration: Number,
    language: String,
  },
});

const ConversationSchema = new Schema<ConversationDocument>(
  {
    userId: { type: String, index: true },
    messages: [MessageSchema],
    metadata: {
      title: String,
      tags: [String],
    },
  },
  {
    timestamps: true,
  }
);

ConversationSchema.index({ createdAt: -1 });
ConversationSchema.index({ 'metadata.tags': 1 });
ConversationSchema.index({ 'messages.tags': 1 });

export default mongoose.models.Conversation || 
  mongoose.model<ConversationDocument>('Conversation', ConversationSchema);