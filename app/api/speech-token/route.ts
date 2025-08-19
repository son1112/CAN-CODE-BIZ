import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { ApiResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Require authentication for this endpoint
    const { userId } = await requireAuth(request);

    // Check if API key is configured
    if (!process.env.ASSEMBLYAI_API_KEY) {
      logger.error('AssemblyAI API key not configured', { 
        component: 'speech-token-api',
        userId 
      });
      return ApiResponse.internalError('Speech recognition service not configured');
    }

    logger.info('Speech token requested', { 
      component: 'speech-token-api',
      userId
    });

    // For now, return the API key securely for authenticated users only
    // TODO: Implement proper token-based authentication for AssemblyAI
    return ApiResponse.success({
      apiKey: process.env.ASSEMBLYAI_API_KEY
    }, 'Speech recognition API key provided');

  } catch (error) {
    return handleApiError(error, 'speech-token-api');
  }
}