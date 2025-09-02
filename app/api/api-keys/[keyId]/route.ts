import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { handleApiError } from '@/lib/error-handler';
import { getApiKeyInfo, revokeApiKey } from '@/lib/api-keys';
import { logger } from '@/lib/logger';

interface RouteParams {
  params: {
    keyId: string;
  };
}

// GET /api/api-keys/[keyId] - Get specific API key info
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await requireAuth(request);
    const { keyId } = params;
    
    const apiKeyInfo = await getApiKeyInfo(keyId, userId);
    
    if (!apiKeyInfo) {
      return NextResponse.json({
        success: false,
        error: 'API key not found'
      }, { status: 404 });
    }
    
    logger.debug('API key info retrieved', {
      component: 'api-keys-api',
      userId,
      keyId
    });
    
    return NextResponse.json({
      success: true,
      apiKey: apiKeyInfo
    });
    
  } catch (error) {
    return handleApiError(error, 'api-keys-get');
  }
}

// DELETE /api/api-keys/[keyId] - Revoke API key
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await requireAuth(request);
    const { keyId } = params;
    
    const success = await revokeApiKey(keyId, userId);
    
    if (!success) {
      return NextResponse.json({
        success: false,
        error: 'API key not found or already revoked'
      }, { status: 404 });
    }
    
    logger.info('API key revoked', {
      component: 'api-keys-api',
      userId,
      keyId
    });
    
    return NextResponse.json({
      success: true,
      message: 'API key revoked successfully'
    });
    
  } catch (error) {
    return handleApiError(error, 'api-keys-revoke');
  }
}