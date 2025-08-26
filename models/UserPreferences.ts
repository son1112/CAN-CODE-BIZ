import mongoose, { Schema, Document } from 'mongoose';
import { ExportCustomizationSettings } from '@/types/export';

export interface UserPreferencesDocument extends Document {
  userId: string;
  notifications: {
    soundEffects: boolean;
    voiceAlerts: boolean;
    systemNotifications: boolean;
  };
  voice: {
    autoSend: boolean;
    silenceThreshold: number;
    voiceQuality: 'low' | 'medium' | 'high';
  };
  display: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    reducedMotion: boolean;
  };
  privacy: {
    saveConversations: boolean;
    shareUsageData: boolean;
    showOnlineStatus: boolean;
  };
  export: ExportCustomizationSettings;
  createdAt: Date;
  updatedAt: Date;
}

const UserPreferencesSchema = new Schema<UserPreferencesDocument>(
  {
    userId: {
      type: String,
      required: true,
      unique: true
    },
    notifications: {
      soundEffects: { type: Boolean, default: true },
      voiceAlerts: { type: Boolean, default: true },
      systemNotifications: { type: Boolean, default: false },
    },
    voice: {
      autoSend: { type: Boolean, default: true },
      silenceThreshold: {
        type: Number,
        default: 2,
        min: 1,
        max: 10
      },
      voiceQuality: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'high'
      },
    },
    display: {
      theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'light'
      },
      language: {
        type: String,
        default: 'en',
        minlength: 2,
        maxlength: 5
      },
      reducedMotion: { type: Boolean, default: false },
    },
    privacy: {
      saveConversations: { type: Boolean, default: true },
      shareUsageData: { type: Boolean, default: false },
      showOnlineStatus: { type: Boolean, default: true },
    },
    export: {
      // Header & Branding
      includeBranding: { type: Boolean, default: false },
      includeAppSubtitle: { type: Boolean, default: false },
      customTitle: { type: String, default: '' },
      
      // Message Metadata
      includeMessageRole: { type: Boolean, default: false },
      includeTimestamp: { type: Boolean, default: false },
      includeMessageId: { type: Boolean, default: false },
      includeAgentInfo: { type: Boolean, default: false },
      includeTags: { type: Boolean, default: false },
      
      // Session Metadata
      includeSessionInfo: { type: Boolean, default: false },
      includeSessionName: { type: Boolean, default: false },
      includeExportTimestamp: { type: Boolean, default: false },
      
      // Document Structure
      includeFooter: { type: Boolean, default: true },
      includeGeneratedBy: { type: Boolean, default: false },
      includeSeparators: { type: Boolean, default: false },
      
      // Content Formatting
      fontSize: { type: Number, default: 11, min: 8, max: 16 },
      margin: { type: Number, default: 20, min: 10, max: 30 },
      includeMarkdownStyling: { type: Boolean, default: true },
      codeBlockStyling: { type: Boolean, default: true },
      
      // Export Format Preferences
      defaultFormat: { 
        type: String, 
        enum: ['pdf', 'word', 'text'], 
        default: 'pdf' 
      },
      fileNameTemplate: { 
        type: String, 
        default: '{sessionName}_{messageId}_{timestamp}' 
      }
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes
UserPreferencesSchema.index({ updatedAt: -1 });

export default mongoose.models.UserPreferences ||
  mongoose.model<UserPreferencesDocument>('UserPreferences', UserPreferencesSchema);