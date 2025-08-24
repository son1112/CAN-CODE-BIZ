import { NextRequest, NextResponse } from 'next/server';
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

    // Return in the format expected by the frontend for backward compatibility
    // TODO: Implement proper token-based authentication for AssemblyAI
    return NextResponse.json({
      apiKey: process.env.ASSEMBLYAI_API_KEY
    });

  } catch (error) {
    return handleApiError(error, 'speech-token-api');
  }
}