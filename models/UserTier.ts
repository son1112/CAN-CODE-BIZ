import mongoose, { Schema, Document, Model } from 'mongoose';

export type UserTierType = 'trial' | 'free' | 'pro' | 'enterprise';

export interface ConversionCheckpoint {
  feature: string;
  timestamp: Date;
  engagement: 'low' | 'medium' | 'high';
  convertedToUpgrade: boolean;
  promptShown?: boolean;
  metadata?: any;
}

export interface TrialAnalytics {
  day: number;
  featuresUsed: string[];
  sessionDuration: number;
  messagesCount: number;
  engagementScore: number;
  timestamp: Date;
  customData?: any;
  _id?: any;
  extensionReason?: string;
  extensionDays?: number;
  previousExtensions?: number;
}

// Interface for static methods
interface UserTierModel extends Model<UserTierDocument> {
  createTrialUser(userId: string, email?: string): Promise<UserTierDocument>;
  findExpiringTrials(daysFromNow?: number): any;
}

export interface UserTierDocument extends Document {
  userId: string;
  email?: string;
  tier: UserTierType;
  
  // Virtual properties
  isTrialActive: boolean;
  trialDaysRemaining: number;
  hasTrialExpired: boolean;
  canExtendTrial: boolean;
  
  // Instance methods
  resetUsageCounters(): void;
  trackFeatureUsage(feature: string, engagement?: 'low' | 'medium' | 'high'): void;
  recordTrialAnalytics(data: Partial<TrialAnalytics>): void;
  extendTrial(days?: number): boolean;
  upgradeToTier(newTier: UserTierType, subscriptionData?: any): void;
  
  // Trial management
  trialStartDate?: Date;
  trialEndDate?: Date;
  trialExtensions: number;
  maxTrialExtensions: number;
  
  // Feature tracking
  featuresUsed: string[];
  conversionCheckpoints: ConversionCheckpoint[];
  trialAnalytics: TrialAnalytics[];
  
  // Subscription details
  subscriptionId?: string;
  subscriptionStatus?: 'active' | 'canceled' | 'past_due' | 'unpaid';
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  
  // Usage tracking
  monthlyMessageCount: number;
  monthlyExportCount: number;
  lastUsageReset: Date;
  
  // Conversion optimization
  lastUpgradePrompt?: Date;
  upgradePromptCount: number;
  conversionSource?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const ConversionCheckpointSchema = new Schema({
  feature: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  engagement: { 
    type: String, 
    enum: ['low', 'medium', 'high'], 
    required: true 
  },
  convertedToUpgrade: { type: Boolean, default: false },
  promptShown: { type: Boolean, default: false }
});

const TrialAnalyticsSchema = new Schema({
  day: { type: Number, required: true },
  featuresUsed: [{ type: String }],
  sessionDuration: { type: Number, default: 0 },
  messagesCount: { type: Number, default: 0 },
  engagementScore: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now }
});

const UserTierSchema = new Schema<UserTierDocument>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    email: {
      type: String,
      sparse: true,
      index: true
    },
    tier: {
      type: String,
      enum: ['trial', 'free', 'pro', 'enterprise'],
      default: 'trial',
      required: true,
      index: true
    },
    
    // Trial management
    trialStartDate: {
      type: Date,
      default: Date.now
    },
    trialEndDate: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    },
    trialExtensions: {
      type: Number,
      default: 0,
      min: 0
    },
    maxTrialExtensions: {
      type: Number,
      default: 2,
      min: 0
    },
    
    // Feature tracking
    featuresUsed: [{
      type: String,
      index: true
    }],
    conversionCheckpoints: [ConversionCheckpointSchema],
    trialAnalytics: [TrialAnalyticsSchema],
    
    // Subscription details
    subscriptionId: {
      type: String,
      sparse: true
    },
    subscriptionStatus: {
      type: String,
      enum: ['active', 'canceled', 'past_due', 'unpaid'],
      sparse: true
    },
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    
    // Usage tracking
    monthlyMessageCount: {
      type: Number,
      default: 0,
      min: 0
    },
    monthlyExportCount: {
      type: Number,
      default: 0,
      min: 0
    },
    lastUsageReset: {
      type: Date,
      default: Date.now
    },
    
    // Conversion optimization
    lastUpgradePrompt: Date,
    upgradePromptCount: {
      type: Number,
      default: 0,
      min: 0
    },
    conversionSource: {
      type: String,
      sparse: true
    }
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
UserTierSchema.index({ tier: 1, trialEndDate: 1 });
UserTierSchema.index({ email: 1, tier: 1 });
UserTierSchema.index({ trialEndDate: 1 }, { sparse: true });
UserTierSchema.index({ updatedAt: -1 });

// Virtual fields
UserTierSchema.virtual('isTrialActive').get(function() {
  if (this.tier !== 'trial') return false;
  if (!this.trialEndDate) return false;
  return new Date() < this.trialEndDate;
});

UserTierSchema.virtual('trialDaysRemaining').get(function() {
  if (this.tier !== 'trial' || !this.trialEndDate) return 0;
  const msRemaining = this.trialEndDate.getTime() - Date.now();
  if (msRemaining <= 0) return 0;
  return Math.ceil(msRemaining / (24 * 60 * 60 * 1000));
});

UserTierSchema.virtual('hasTrialExpired').get(function() {
  if (this.tier !== 'trial') return false;
  if (!this.trialEndDate) return false;
  return new Date() >= this.trialEndDate;
});

UserTierSchema.virtual('canExtendTrial').get(function() {
  return this.tier === 'trial' && this.trialExtensions < this.maxTrialExtensions;
});

// Instance methods
UserTierSchema.methods.extendTrial = function(days: number = 3): boolean {
  if (!this.canExtendTrial) return false;
  
  if (this.trialEndDate) {
    this.trialEndDate = new Date(this.trialEndDate.getTime() + days * 24 * 60 * 60 * 1000);
  } else {
    this.trialEndDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }
  
  this.trialExtensions += 1;
  return true;
};

UserTierSchema.methods.trackFeatureUsage = function(feature: string, engagement: 'low' | 'medium' | 'high' = 'medium'): void {
  // Add to features used if not already tracked
  if (!this.featuresUsed.includes(feature)) {
    this.featuresUsed.push(feature);
  }
  
  // Add conversion checkpoint
  this.conversionCheckpoints.push({
    feature,
    timestamp: new Date(),
    engagement,
    convertedToUpgrade: false
  });
};

UserTierSchema.methods.recordTrialAnalytics = function(data: Partial<TrialAnalytics>): void {
  if (this.tier !== 'trial') return;
  
  const trialDay = this.trialStartDate 
    ? Math.floor((Date.now() - this.trialStartDate.getTime()) / (24 * 60 * 60 * 1000)) + 1
    : 1;
  
  this.trialAnalytics.push({
    day: trialDay,
    featuresUsed: data.featuresUsed || [],
    sessionDuration: data.sessionDuration || 0,
    messagesCount: data.messagesCount || 0,
    engagementScore: data.engagementScore || 0,
    timestamp: new Date()
  });
};

UserTierSchema.methods.upgradeToTier = function(newTier: UserTierType, subscriptionData?: any): void {
  this.tier = newTier;
  
  if (subscriptionData) {
    this.subscriptionId = subscriptionData.subscriptionId;
    this.subscriptionStatus = subscriptionData.status || 'active';
    this.currentPeriodStart = subscriptionData.currentPeriodStart;
    this.currentPeriodEnd = subscriptionData.currentPeriodEnd;
  }
  
  // Mark any pending conversion checkpoints as converted
  this.conversionCheckpoints.forEach((checkpoint: ConversionCheckpoint) => {
    if (!checkpoint.convertedToUpgrade) {
      checkpoint.convertedToUpgrade = true;
    }
  });
};

UserTierSchema.methods.resetUsageCounters = function(): void {
  const now = new Date();
  const lastReset = this.lastUsageReset || new Date(0);
  
  // Reset if it's been more than 30 days
  if (now.getTime() - lastReset.getTime() > 30 * 24 * 60 * 60 * 1000) {
    this.monthlyMessageCount = 0;
    this.monthlyExportCount = 0;
    this.lastUsageReset = now;
  }
};

// Static methods
UserTierSchema.statics.createTrialUser = async function(userId: string, email?: string) {
  const existing = await this.findOne({ userId });
  if (existing) return existing;
  
  return this.create({
    userId,
    email,
    tier: 'trial',
    trialStartDate: new Date(),
    trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    featuresUsed: [],
    conversionCheckpoints: [],
    trialAnalytics: []
  });
};

UserTierSchema.statics.findExpiringTrials = function(daysFromNow: number = 1) {
  const targetDate = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
  return this.find({
    tier: 'trial',
    trialEndDate: { $lte: targetDate, $gte: new Date() }
  });
};

UserTierSchema.statics.getTrialAnalytics = function(userId: string) {
  return this.findOne({ userId }).select('trialAnalytics conversionCheckpoints featuresUsed tier trialStartDate trialEndDate');
};

// Pre-save middleware
UserTierSchema.pre('save', function() {
  // Reset usage counters if needed
  this.resetUsageCounters();
  
  // Ensure trial users have proper dates
  if (this.tier === 'trial') {
    if (!this.trialStartDate) {
      this.trialStartDate = new Date();
    }
    if (!this.trialEndDate) {
      this.trialEndDate = new Date(this.trialStartDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
  }
});

export default (mongoose.models.UserTier as UserTierModel) || 
  mongoose.model<UserTierDocument, UserTierModel>('UserTier', UserTierSchema);