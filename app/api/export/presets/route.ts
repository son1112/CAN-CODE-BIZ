import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { handleApiError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { DEFAULT_EXPORT_PRESETS } from '@/types/export';

// GET /api/export/presets - Get available export presets
export async function GET(request: NextRequest) {
  try {
    // Auth is optional for presets - they're just templates
    let userId = 'anonymous';
    try {
      const auth = await requireAuth(request);
      userId = auth.userId;
    } catch {
      // Allow anonymous access to presets
    }

    logger.info('Export presets retrieved', {
      component: 'export-presets-api',
      userId,
      presetCount: DEFAULT_EXPORT_PRESETS.length
    });

    return NextResponse.json({
      success: true,
      presets: DEFAULT_EXPORT_PRESETS
    });

  } catch (error) {
    return handleApiError(error, 'export-presets-api');
  }
}