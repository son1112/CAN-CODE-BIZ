import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { getCurrentProjectUsage } from '@/lib/ccusage';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const userId = await requireAuth(req);
    
    logger.info('Fetching ccusage data', {
      component: 'UsageAPI',
      userId
    });

    const usageData = await getCurrentProjectUsage();
    
    if (!usageData) {
      logger.warn('No ccusage data available', {
        component: 'UsageAPI',
        userId
      });
      
      return NextResponse.json({
        success: false,
        message: 'No usage data available'
      });
    }

    logger.info('ccusage data fetched successfully', {
      component: 'UsageAPI',
      userId,
      projectCost: usageData.projectCost,
      projectTokens: usageData.projectTokens
    });

    return NextResponse.json({
      success: true,
      data: usageData
    });

  } catch (error) {
    logger.error('Failed to fetch ccusage data', {
      component: 'UsageAPI'
    }, error);

    return NextResponse.json(
      { error: 'Failed to fetch usage data' },
      { status: 500 }
    );
  }
}