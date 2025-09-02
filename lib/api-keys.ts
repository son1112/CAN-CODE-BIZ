/**
 * API Key Management Utilities
 * Handles generation, validation, and management of API keys
 */

import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import ApiKey, { IApiKey } from '@/models/ApiKey';
import connectDB from '@/lib/mongodb';
import { logger } from '@/lib/logger';

export interface ApiKeyGenerationOptions {
  name: string;
  description?: string;
  userId: string;
  scopes: string[];
  expiresInDays?: number;
  rateLimit?: {
    requestsPerMinute?: number;
    requestsPerHour?: number;
    requestsPerDay?: number;
  };
  ipWhitelist?: string[];
}

export interface ApiKeyInfo {
  keyId: string;
  name: string;
  description?: string;
  scopes: string[];
  isActive: boolean;
  expiresAt?: Date;
  lastUsedAt?: Date;
  usageCount: number;
  keyPreview: string;
  createdAt: Date;
  rateLimit?: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
}

export interface ApiKeyValidationResult {
  isValid: boolean;
  userId?: string;
  keyInfo?: IApiKey;
  error?: string;
  scopes?: string[];
}

/**
 * Generate a secure API key
 * Format: rbl_live_[32_chars]_[4_chars_checksum]
 */
export function generateApiKey(): { key: string; keyId: string } {
  // Generate random bytes for the key
  const randomBytes = crypto.randomBytes(24); // 24 bytes = 32 chars when base64url encoded
  const keyData = randomBytes.toString('base64url').slice(0, 32);
  
  // Generate checksum for verification
  const checksum = crypto.createHash('sha256')
    .update(keyData)
    .digest('base64url')
    .slice(0, 4);
  
  const key = `rbl_live_${keyData}_${checksum}`;
  const keyId = `rbl_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
  
  return { key, keyId };
}

/**
 * Validate API key format
 */
export function validateApiKeyFormat(key: string): boolean {
  const apiKeyRegex = /^rbl_live_[A-Za-z0-9_-]{32}_[A-Za-z0-9_-]{4}$/;
  return apiKeyRegex.test(key);
}

/**
 * Extract key data and verify checksum
 */
export function verifyApiKeyChecksum(key: string): boolean {
  if (!validateApiKeyFormat(key)) {
    return false;
  }
  
  const parts = key.split('_');
  if (parts.length !== 4) return false;
  
  const keyData = parts[2];
  const providedChecksum = parts[3];
  
  const calculatedChecksum = crypto.createHash('sha256')
    .update(keyData)
    .digest('base64url')
    .slice(0, 4);
  
  return providedChecksum === calculatedChecksum;
}

/**
 * Create a new API key
 */
export async function createApiKey(options: ApiKeyGenerationOptions): Promise<{ apiKey: IApiKey; rawKey: string }> {
  await connectDB();
  
  const { key, keyId } = generateApiKey();
  const hashedKey = crypto.createHash('sha256').update(key).digest('hex');
  
  // Extract key preview from generated key for database storage
  const keyParts = key.split('_');
  const keyPreview = keyParts[2].substring(0, 8);
  
  // Calculate expiration date
  let expiresAt: Date | undefined;
  if (options.expiresInDays && options.expiresInDays > 0) {
    expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + options.expiresInDays);
  }
  
  const apiKey = new ApiKey({
    keyId,
    name: options.name,
    description: options.description,
    hashedKey,
    keyPreview,
    userId: options.userId,
    scopes: options.scopes,
    expiresAt,
    rateLimit: {
      requestsPerMinute: options.rateLimit?.requestsPerMinute || 60,
      requestsPerHour: options.rateLimit?.requestsPerHour || 1000,
      requestsPerDay: options.rateLimit?.requestsPerDay || 10000
    },
    ipWhitelist: options.ipWhitelist,
    isActive: true,
    usageCount: 0
  });
  
  await apiKey.save();
  
  logger.info('API key created', {
    component: 'api-keys',
    keyId,
    userId: options.userId,
    scopes: options.scopes.length
  });
  
  return { apiKey, rawKey: key };
}

/**
 * Validate API key and return user info
 */
export async function validateApiKey(key: string, ipAddress?: string): Promise<ApiKeyValidationResult> {
  try {
    // Basic format validation
    if (!validateApiKeyFormat(key) || !verifyApiKeyChecksum(key)) {
      return { isValid: false, error: 'Invalid API key format' };
    }
    
    await connectDB();
    
    // Extract key data from the key for database lookup  
    const keyParts = key.split('_');
    if (keyParts.length !== 4 || keyParts[0] !== 'rbl' || keyParts[1] !== 'live') {
      return { isValid: false, error: 'Invalid API key format' };
    }
    
    const keyData = keyParts[2];
    const keyPreview = keyData.substring(0, 8);
    
    // Find API key by keyPreview (includes hashed key in select)
    const apiKeyDoc = await ApiKey.findOne({ 
      keyPreview,
      isActive: true 
    }).select('+hashedKey');
    
    if (!apiKeyDoc) {
      logger.warn('API key not found', {
        component: 'api-keys',
        keyPreview: keyId,
        ipAddress
      });
      return { isValid: false, error: 'API key not found' };
    }
    
    // Verify the hashed key
    const hashedProvidedKey = crypto.createHash('sha256').update(key).digest('hex');
    const isKeyValid = hashedProvidedKey === apiKeyDoc.hashedKey;
    if (!isKeyValid) {
      logger.warn('API key hash mismatch', {
        component: 'api-keys',
        keyId: apiKeyDoc.keyId,
        ipAddress
      });
      return { isValid: false, error: 'Invalid API key' };
    }
    
    // Check if key is expired
    if (apiKeyDoc.isExpired()) {
      logger.warn('API key expired', {
        component: 'api-keys',
        keyId: apiKeyDoc.keyId,
        expiresAt: apiKeyDoc.expiresAt
      });
      return { isValid: false, error: 'API key expired' };
    }
    
    // Check IP whitelist if configured
    if (apiKeyDoc.ipWhitelist && apiKeyDoc.ipWhitelist.length > 0 && ipAddress) {
      const isIpAllowed = apiKeyDoc.ipWhitelist.some(allowedIp => {
        // Support CIDR notation and exact matches
        if (allowedIp.includes('/')) {
          // CIDR notation - would need additional library for full support
          return allowedIp.split('/')[0] === ipAddress;
        }
        return allowedIp === ipAddress;
      });
      
      if (!isIpAllowed) {
        logger.warn('API key IP not whitelisted', {
          component: 'api-keys',
          keyId: apiKeyDoc.keyId,
          ipAddress,
          whitelist: apiKeyDoc.ipWhitelist
        });
        return { isValid: false, error: 'IP address not allowed' };
      }
    }
    
    // Update usage statistics (async, don't await to avoid blocking)
    setImmediate(() => {
      apiKeyDoc.updateUsage(ipAddress).catch(error => {
        logger.error('Failed to update API key usage', {
          component: 'api-keys',
          keyId: apiKeyDoc.keyId
        }, error);
      });
    });
    
    logger.debug('API key validation successful', {
      component: 'api-keys',
      keyId: apiKeyDoc.keyId,
      userId: apiKeyDoc.userId,
      scopes: apiKeyDoc.scopes.length
    });
    
    return {
      isValid: true,
      userId: apiKeyDoc.userId,
      keyInfo: apiKeyDoc,
      scopes: apiKeyDoc.scopes
    };
    
  } catch (error) {
    logger.error('API key validation error', {
      component: 'api-keys'
    }, error);
    return { isValid: false, error: 'Validation failed' };
  }
}

/**
 * Get API key info (safe, without sensitive data)
 */
export async function getApiKeyInfo(keyId: string, userId: string): Promise<ApiKeyInfo | null> {
  await connectDB();
  
  const apiKey = await ApiKey.findOne({ keyId, userId, isActive: true });
  if (!apiKey) return null;
  
  return {
    keyId: apiKey.keyId,
    name: apiKey.name,
    description: apiKey.description,
    scopes: apiKey.scopes,
    isActive: apiKey.isActive,
    expiresAt: apiKey.expiresAt,
    lastUsedAt: apiKey.lastUsedAt,
    usageCount: apiKey.usageCount,
    keyPreview: `rbl_live_${apiKey.keyPreview}****`,
    createdAt: apiKey.createdAt,
    rateLimit: apiKey.rateLimit
  };
}

/**
 * List user's API keys
 */
export async function listUserApiKeys(userId: string): Promise<ApiKeyInfo[]> {
  await connectDB();
  
  const apiKeys = await ApiKey.findActiveByUserId(userId);
  
  return apiKeys.map(apiKey => ({
    keyId: apiKey.keyId,
    name: apiKey.name,
    description: apiKey.description,
    scopes: apiKey.scopes,
    isActive: apiKey.isActive,
    expiresAt: apiKey.expiresAt,
    lastUsedAt: apiKey.lastUsedAt,
    usageCount: apiKey.usageCount,
    keyPreview: `rbl_live_${apiKey.keyPreview}****`,
    createdAt: apiKey.createdAt,
    rateLimit: apiKey.rateLimit
  }));
}

/**
 * Revoke API key
 */
export async function revokeApiKey(keyId: string, userId: string): Promise<boolean> {
  await connectDB();
  
  const result = await ApiKey.updateOne(
    { keyId, userId },
    { isActive: false, updatedAt: new Date() }
  );
  
  if (result.modifiedCount > 0) {
    logger.info('API key revoked', {
      component: 'api-keys',
      keyId,
      userId
    });
    return true;
  }
  
  return false;
}

/**
 * Check if API key has required scope
 */
export function hasScope(scopes: string[], requiredScope: string): boolean {
  return scopes.includes(requiredScope) || scopes.includes('admin:write');
}

/**
 * Available scopes with descriptions
 */
export const AVAILABLE_SCOPES = {
  'chat:read': 'Read chat messages and conversations',
  'chat:write': 'Send messages and create conversations',
  'sessions:read': 'Read session data and history',
  'sessions:write': 'Create and modify sessions',
  'sessions:delete': 'Delete sessions',
  'agents:read': 'Read agent configurations',
  'agents:write': 'Create and modify agents',
  'export:pdf': 'Export conversations to PDF',
  'export:word': 'Export conversations to Word documents',
  'tags:read': 'Read message tags',
  'tags:write': 'Create and modify tags',
  'stars:read': 'Read starred messages',
  'stars:write': 'Star and unstar messages',
  'admin:read': 'Administrative read access',
  'admin:write': 'Administrative write access (includes all other scopes)'
} as const;

export type ApiKeyScope = keyof typeof AVAILABLE_SCOPES;