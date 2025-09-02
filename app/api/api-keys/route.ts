import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { handleApiError, ValidationRequestError } from '@/lib/error-handler';
import { validators } from '@/lib/validators';
import { createApiKey, listUserApiKeys, AVAILABLE_SCOPES } from '@/lib/api-keys';
import { logger } from '@/lib/logger';

// GET /api/api-keys - List user's API keys
export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);
    
    const apiKeys = await listUserApiKeys(userId);
    
    logger.info('API keys listed', {
      component: 'api-keys-api',
      userId,
      keyCount: apiKeys.length
    });
    
    return NextResponse.json({
      success: true,
      apiKeys,
      availableScopes: AVAILABLE_SCOPES
    });
    
  } catch (error) {
    return handleApiError(error, 'api-keys-list');
  }
}

// POST /api/api-keys - Create new API key
export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);
    
    const body = await request.json();
    
    // Validate request body
    const validation = validators.createApiKey(body);
    if (!validation.isValid) {
      const errorMessages = validation.errors.map(e => `${e.field}: ${e.message}`).join(', ');
      throw new ValidationRequestError('Invalid request data', errorMessages);
    }
    
    const { 
      name, 
      description, 
      scopes, 
      expiresInDays,
      rateLimit,
      ipWhitelist 
    } = body;
    
    // Validate scopes
    const validScopes = Object.keys(AVAILABLE_SCOPES);
    const invalidScopes = scopes.filter((scope: string) => !validScopes.includes(scope));
    if (invalidScopes.length > 0) {
      throw new ValidationRequestError('Invalid scopes', `Invalid scopes: ${invalidScopes.join(', ')}`);
    }
    
    // Create API key
    const result = await createApiKey({
      name,
      description,
      userId,
      scopes,
      expiresInDays,
      rateLimit,
      ipWhitelist
    });
    
    logger.info('API key created', {
      component: 'api-keys-api',
      userId,
      keyId: result.apiKey.keyId,
      scopes: scopes.length
    });
    
    // Return the raw key only once during creation
    return NextResponse.json({
      success: true,
      message: 'API key created successfully',
      apiKey: {
        keyId: result.apiKey.keyId,
        name: result.apiKey.name,
        description: result.apiKey.description,
        scopes: result.apiKey.scopes,
        expiresAt: result.apiKey.expiresAt,
        keyPreview: `rbl_live_${result.apiKey.keyPreview}****`,
        rateLimit: result.apiKey.rateLimit,
        createdAt: result.apiKey.createdAt
      },
      rawKey: result.rawKey, // Only returned here, never again
      warning: 'Store this API key securely. It will not be shown again.'
    }, { status: 201 });
    
  } catch (error) {
    return handleApiError(error, 'api-keys-create');
  }
}