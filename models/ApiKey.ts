import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IApiKey extends Document {
  keyId: string;
  name: string;
  description?: string;
  hashedKey: string;
  keyPreview: string; // First 8 chars for identification
  userId: string;
  scopes: string[];
  isActive: boolean;
  expiresAt?: Date;
  lastUsedAt?: Date;
  usageCount: number;
  rateLimit?: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
  ipWhitelist?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const apiKeySchema = new Schema<IApiKey>({
  keyId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  hashedKey: {
    type: String,
    required: true,
    unique: true,
    select: false // Never include in queries by default
  },
  keyPreview: {
    type: String,
    required: true,
    length: 8
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  scopes: [{
    type: String,
    enum: [
      'chat:read',
      'chat:write', 
      'sessions:read',
      'sessions:write',
      'sessions:delete',
      'agents:read',
      'agents:write',
      'export:pdf',
      'export:word',
      'tags:read',
      'tags:write',
      'stars:read',
      'stars:write',
      'admin:read',
      'admin:write'
    ]
  }],
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  expiresAt: {
    type: Date
  },
  lastUsedAt: {
    type: Date
  },
  usageCount: {
    type: Number,
    default: 0
  },
  rateLimit: {
    requestsPerMinute: {
      type: Number,
      default: 60
    },
    requestsPerHour: {
      type: Number,
      default: 1000
    },
    requestsPerDay: {
      type: Number,
      default: 10000
    }
  },
  ipWhitelist: [{
    type: String,
    validate: {
      validator: function(ip: string) {
        // Basic IP validation (supports IPv4, IPv6, and CIDR)
        const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?:\/[0-9]{1,2})?$/;
        const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}(?:\/[0-9]{1,3})?$/;
        return ipv4Regex.test(ip) || ipv6Regex.test(ip);
      },
      message: 'Invalid IP address or CIDR notation'
    }
  }]
}, {
  timestamps: true,
  collection: 'apikeys'
});

// Indexes for performance
apiKeySchema.index({ userId: 1, isActive: 1 });
apiKeySchema.index({ keyId: 1, isActive: 1 });
apiKeySchema.index({ expiresAt: 1 }, { sparse: true });
apiKeySchema.index({ lastUsedAt: -1 });

// Methods
apiKeySchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  delete obj.hashedKey;
  return obj;
};

apiKeySchema.methods.hasScope = function(requiredScope: string): boolean {
  return this.scopes.includes(requiredScope);
};

apiKeySchema.methods.isExpired = function(): boolean {
  return this.expiresAt && this.expiresAt < new Date();
};

apiKeySchema.methods.updateUsage = async function(ipAddress?: string) {
  this.usageCount += 1;
  this.lastUsedAt = new Date();
  
  // Add IP to whitelist if not already present (for tracking)
  if (ipAddress && this.ipWhitelist && this.ipWhitelist.length > 0) {
    // Only update if IP whitelist is configured
  }
  
  await this.save();
};

// Statics
apiKeySchema.statics.findByKeyId = function(keyId: string) {
  return this.findOne({ keyId, isActive: true }).select('+hashedKey');
};

apiKeySchema.statics.findActiveByUserId = function(userId: string) {
  return this.find({ userId, isActive: true }).sort({ createdAt: -1 });
};

// Pre-save middleware - keyPreview is set manually in createApiKey function

// Create and export model
const ApiKey: Model<IApiKey> = mongoose.models.ApiKey || mongoose.model<IApiKey>('ApiKey', apiKeySchema);

export default ApiKey;