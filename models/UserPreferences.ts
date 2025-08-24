import mongoose, { Schema, Document } from 'mongoose';

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
  },
  {
    timestamps: true,
  }
);

// Create indexes
UserPreferencesSchema.index({ updatedAt: -1 });

export default mongoose.models.UserPreferences ||
  mongoose.model<UserPreferencesDocument>('UserPreferences', UserPreferencesSchema);