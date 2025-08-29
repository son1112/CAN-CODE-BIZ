import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    // Basic health check
    const timestamp = new Date().toISOString();

    // Check database connection
    await connectDB();

    logger.info('Health check successful', {
      component: 'health-api',
      timestamp,
      status: 'healthy'
    });

    // Limit exposed information in production
    const isProduction = process.env.NODE_ENV === 'production';
    const response = {
      status: 'healthy',
      timestamp,
      ...(isProduction ? {} : {
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      }),
      services: {
        database: 'connected',
        api: 'operational'
      }
    };

    return NextResponse.json(response, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    logger.error('Health check failed', {
      component: 'health-api',
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 });
  }
}